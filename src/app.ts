import { createServer } from '@apie/utils/server';
import db from '@apie/utils/db';
import logger from '@apie/utils/logger';
import cacheExternal from './utils/cacheExternal';

cacheExternal.open()
  .then(() => db.open())
  .then(() => createServer())
  .then(server => {
    server.listen(3000, () => {
      logger.info('Listening on http://localhost:3000');
    });
  })
  .catch(err => {
    logger.error(`Error: ${err}`);
  });