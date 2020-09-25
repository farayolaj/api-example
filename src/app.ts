import { createServer } from '@apie/utils/server';
import db from '@apie/utils/db';
import logger from '@apie/utils/logger';

// todo: pick up at user services
db.open()
  .then(() => createServer())
  .then(server => {
    server.listen(3000, () => {
      logger.info('Listening on http://localhost:3000');
    });
  })
  .catch(err => {
    logger.error(`Error: ${err}`);
  });

createServer()
  .then(server => {
    server.listen(3000, () => {
      logger.info('Listening on http://localhost:3000');
    });
  })
  .catch(err => {
    logger.error(`Error: ${err}`);
  });