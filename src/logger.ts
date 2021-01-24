import * as _ from 'lodash';
import * as winston from 'winston';

import * as config from './config';

const logger = winston.createLogger({
  level: config.logging.level,
  format: winston.format.simple(),
  transports: [new winston.transports.Console()],
});

if (config.env.test && config.logging.level !== 'debug') {
  logger.remove(winston.transports.Console);
}

export default logger;
