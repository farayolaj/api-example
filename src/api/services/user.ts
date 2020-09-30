import fs from 'fs';
import jwt, { SignOptions, VerifyErrors, VerifyOptions } from 'jsonwebtoken';

import User, { IUser } from '@apie/api/models/user';
import config from '@apie/config';
import logger from '@apie/utils/logger';
import cacheLocal from '@apie/utils/cacheLocal';
import cacheExternal from '@apie/utils/cacheExternal';

export type ErrorResponse = { error: { type: string, message: string } }
export type AuthResponse = ErrorResponse | { userId: string }
export type CreateUserResponse = ErrorResponse | { userId: string }
export type LoginUserResponse = ErrorResponse | { token: string, userId: string, expireAt: Date }

const privateKey = fs.readFileSync(config.privateKeyFile);
const privateSecret = {
  key: privateKey,
  passphrase: config.privateKeyPassphrase
};
const signOptions: SignOptions = {
  algorithm: 'RS256',
  expiresIn: '14d'
};

const publicKey = fs.readFileSync(config.publicKeyFile);
const verifyOptions: VerifyOptions = {
  algorithms: ['RS256']
};

/** Check if auth token is valid */
async function auth(bearerToken: string): Promise<AuthResponse> {
  const token = bearerToken.replace('Bearer ', '');

  try {
    const userId = await cacheExternal.getProp(token);
    if (userId) {
      return { userId };
    }
  } catch (err) {
    logger.warn(`login.cache.addToken: ${err}`);
  }

  return new Promise(function (resolve, reject) {
    // eslint-disable-next-line @typescript-eslint/ban-types
    jwt.verify(token, publicKey, verifyOptions, (err: VerifyErrors | null, decoded: object | undefined) => {
      if (err === null && decoded !== undefined && (decoded as any).userId !== undefined) {
        const d = decoded as { userId: string, exp: number };
        const expireAfter = d.exp - Math.round((new Date()).valueOf() / 1000);
        cacheExternal.setProp(token, d.userId, expireAfter)
          .then(() => {
            resolve({ userId: d.userId });
          })
          .catch((err) => {
            resolve({ userId: d.userId });
            logger.warn(`auth.cache.addToken: ${err}`);
          });
      } else {
        resolve({ error: { type: 'unauthorized', message: 'Authentication Failed' } });
      }
    });
  });
}

/** Create auth token */
function createAuthToken(userId: string): Promise<{ token: string, expireAt: Date }> {
  return new Promise(function (resolve, reject) {
    jwt.sign({ userId: userId }, privateSecret, signOptions, (err: Error | null, encoded: string | undefined) => {
      if (err === null && encoded !== undefined) {
        const expireAfter = 2 * 604800; /* two weeks */
        const expireAt = new Date();
        expireAt.setSeconds(expireAt.getSeconds() + expireAfter);

        cacheExternal.setProp(encoded, userId, expireAfter)
          .then(() => {
            resolve({ token: encoded, expireAt: expireAt });
          }).catch(err => {
            logger.warn(`createAuthToken.setProp: ${err}`);
            resolve({ token: encoded, expireAt: expireAt });
          });
      } else {
        reject(err);
      }
    });
  });
}

/** Authenticate using email and password */
async function login(login: string, password: string): Promise<LoginUserResponse> {
  try {
    // const user = await User.findOne({email: login});
    // if (!user) {
    //   return {error: {type: 'invalid_credentials', message: 'Invalid Login/Password'}};
    // }

    let user: IUser | undefined | null = cacheLocal.get<IUser>(login);
    if (!user) {
      user = await User.findOne({ email: login });
      if (!user) {
        return { error: { type: 'invalid_credentials', message: 'Invalid Login/Password' } };
      }

      cacheLocal.set(user._id.toString(), user);
      cacheLocal.set(login, user);
    }

    const passwordMatch = await user.comparePassword(password);
    if (!passwordMatch) {
      return { error: { type: 'invalid_credentials', message: 'Invalid Login/Password' } };
    }

    const authToken = await createAuthToken(user._id.toString());
    return { userId: user._id.toString(), token: authToken.token, expireAt: authToken.expireAt };
  } catch (err) {
    logger.error(`login: ${err}`);
    return Promise.reject({ error: { type: 'internal_server_error', message: 'Internal Server Error' } });
  }
}

/** Create new user account */
function createUser(email: string, password: string, name: string): Promise<CreateUserResponse> {
  return new Promise(function (resolve, reject) {
    const user = new User({ email: email, password: password, name: name });
    user.save()
      .then(u => {
        resolve({ userId: u._id.toString() });
      })
      .catch(err => {
        if (err.code === 11000) {
          resolve({ error: { type: 'account_already_exists', message: `${email} already exists` } });
        } else {
          logger.error(`createUser: ${err}`);
          reject(err);
        }
      });
  });
}

export default { auth: auth, createAuthToken: createAuthToken, login: login, createUser: createUser };