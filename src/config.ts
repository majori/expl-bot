import { CLILoggingLevel } from 'winston';

namespace Config {
  export const env = {
    prod: process.env.NODE_ENV === 'production',
    dev: process.env.NODE_ENV === 'development',
    test: process.env.NODE_ENV === 'test',
  };

  export const tg = {
    token: process.env.TELEGRAM_TOKEN,
    webhook: process.env.WEBHOOK_DOMAIN,
    port: parseInt(process.env.PORT as string, 10) || 6000,
  };

  export const logging = {
    level: (process.env.LOG_LEVEL || 'info') as CLILoggingLevel,
  };

  export const db = {
    development: {
      client: 'pg',
      connection: process.env.DATABASE_URL || {
        host: 'localhost',
        port: 6001,
        database: 'postgres',
        user: 'postgres',
        password: 'password12!',
      },
      pool: {
        min: 2,
        max: 10,
      },
      migrations: {
        tableName: 'knex_migrations',
      },
    },

    production: {
      client: 'pg',
      connection: process.env.DATABASE_URL,
      pool: {
        min: 2,
        max: 10,
      },
      migrations: {
        tableName: 'knex_migrations',
      },
    },
  };

}

export default Config;
