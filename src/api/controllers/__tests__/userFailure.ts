import request from 'supertest';
import faker from 'faker';
import {Express} from 'express-serve-static-core';

import UserService from '@apie/api/services/user';
import {createServer} from '@apie/utils/server';
import db from '@apie/utils/db';
import cacheExternal from '@apie/utils/cacheExternal';

jest.mock('@apie/api/services/user');

let server: Express;
beforeAll(async () => {
  await cacheExternal.open();
  await db.open();
  server = await createServer();
});

afterAll(async () => {
  await cacheExternal.close();
  await db.close();
});

describe('auth failure', () => {
  it('should return 500 & valid response if auth rejects with an error', async done => {
    (UserService.auth as jest.Mock).mockRejectedValue(new Error());
    request(server)
      .get('/api/v1/goodbye')
      .set('Authorization', 'Bearer fakeToken')
      .expect(500)
      .end(function(err, res) {
        if (err) return done(err);
        expect(res.body).toMatchObject({error: {type: 'internal_server_error', message: 'Internal Server Error'}});
        done();
      });
  });
});

describe('createUser failure', () => {
  it('should return 500 & valid response if auth rejects with an error', async done => {
    (UserService.createUser as jest.Mock).mockResolvedValue({error: {type: 'unkonwn'}});
    request(server)
      .post('/api/v1/user')
      .send({
        email: faker.internet.email(),
        password: faker.internet.password(),
        name: faker.name.firstName()
      })
      .expect(500)
      .end(function(err, res) {
        if (err) return done(err);
        expect(res.body).toMatchObject({error: {type: 'internal_server_error', message: 'Internal Server Error'}});
        done();
      });
  });
});

describe('login failure', () => {
  it('should return 500 & valid response if auth rejects with an error', async done => {
    (UserService.login as jest.Mock).mockResolvedValue({error: {type: 'unkonwn'}});
    request(server)
      .post('/api/v1/login')
      .send({
        email: faker.internet.email(),
        password: faker.internet.password()
      })
      .expect(500)
      .end(function(err, res) {
        if (err) return done(err);
        expect(res.body).toMatchObject({error: {type: 'internal_server_error', message: 'Internal Server Error'}});
        done();
      });
  });
});