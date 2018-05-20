import * as path from 'path';
import * as _ from 'lodash';
import { Logger as Winston, transports, CLILoggingLevel } from 'winston';
import config from './config';

export class Logger extends Winston {

  constructor(filePath?: string) {
    super();

    this.configure({
      transports: [
        new transports.Console({
          label: filePath ? path.basename(filePath) : require('../package.json').name,
          timestamp: true,
          colorize: true,
        }),
      ],
    });

    // Suppress console messages when testing
    if (config.env.test && process.env.LOG_LEVEL !== 'debug') {
      this.remove(transports.Console);
    }

    this.setLevelForTransports(config.logging.level);
  }

  private setLevelForTransports(level: CLILoggingLevel) {
    _.forEach(this.transports, (transport) => {
      transport.level = level;
    });
  }
}

export default Logger;
