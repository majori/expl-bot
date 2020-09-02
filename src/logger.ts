import * as path from 'path';
import * as _ from 'lodash';
import * as winston from 'winston';
import * as config from './config';

const logger = winston.createLogger({
  level: config.logging.level,
  format: winston.format.simple(),
  defaultMeta: { service: 'user-service' },
  transports: [new winston.transports.Console()],
});

if (config.env.test && config.logging.level !== 'debug') {
  console.log(config.env.test);
  console.log(config.logging.level);
  logger.remove(winston.transports.Console);
}

export default logger;
