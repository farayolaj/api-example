import express from 'express';
import bodyParser from 'body-parser';
import { OpenApiValidator } from 'express-openapi-validator';
import { Express } from 'express-serve-static-core';
import morgan from 'morgan';
import morganBody from 'morgan-body';
import { connector, summarise } from 'swagger-routes-express';
import YAML from 'yamljs';

import * as api from '@apie/api/controllers';
import logger from '@apie/utils/logger';
import config from '@apie/config';
import { expressDevLogger } from '@apie/utils/expressDevLogger';

export async function createServer(): Promise<Express> {
  const yamlSpecFile = './config/openapi.yaml';
  const apiDefinition = YAML.load(yamlSpecFile);
  const apiSummary = summarise(apiDefinition);
  logger.info(apiSummary);

  const server = express();
  // here we can intialize body/cookies parsers, connect logger, for example morgan
  server.use(bodyParser.json());

  /* istanbul ignore next */
  if (config.morganLogger)
    server.use(morgan(':method :url :status :response-time ms - :res[content-length]'));

  /* istanbul ignore next */
  if (config.morganBodyLogger)
    morganBody(server);
    
  /* istanbul ignore next */
  if (config.exmplDevLogger)
    server.use(expressDevLogger);

  // setup API validator
  const validatorOptions = {
    coerceTypes: true,
    apiSpec: yamlSpecFile,
    validateRequests: true,
    validateResponses: true
  };
  await new OpenApiValidator(validatorOptions).install(server);

  // error customization, if request is invalid
  server.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    res.status(err.status).json({
      error: {
        type: 'request_validation',
        message: err.message,
        errors: err.errors
      }
    });
  });

  const connect = connector(api, apiDefinition, {
    onCreateRoute: (method: string, descriptor: any[]) => {
      descriptor.shift();
      logger.verbose(`${method}: ${descriptor.map((d: any) => d.name).join(', ')}`);
    },
    security: {
      bearerAuth: api.auth
    }
  });

  connect(server);

  return server;
}