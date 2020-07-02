import { CLILoggingLevel } from 'winston';

export const env = {
  prod: process.env.NODE_ENV === 'production',
  dev: process.env.NODE_ENV === 'development',
  test: process.env.NODE_ENV === 'test',
};

export const tg = {
  token: process.env.TELEGRAM_TOKEN,
  webhook: process.env.WEBHOOK_DOMAIN,
  port: process.env.PORT ? parseInt(process.env.PORT, 10) : 6000,
};

export const logging = {
  level: (process.env.LOG_LEVEL || 'info') as CLILoggingLevel,
};

export const db = {
  production: {
    client: 'pg',
    connection: process.env.PG_CONNECTION_STRING || {
      host: process.env.PG_HOST,
      port: parseInt(process.env.PG_PORT || '5432', 10),
      database: process.env.PG_DATABASE,
      user: process.env.PG_USER,
      password: process.env.PG_PASSWORD,
    },
    pool: {
      min: 2,
      max: 10,
    },
  },

  development: {
    client: 'pg',
    connection: process.env.PG_CONNECTION_STRING || {
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
  },

  test: {
    client: 'pg',
    connection: process.env.PG_CONNECTION_STRING,
    pool: {
      min: 2,
      max: 10,
    },
  },
};
