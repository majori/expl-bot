import type { CLILoggingLevel } from 'winston';
import type * as Knex from 'knex';

export const env = {
  prod: process.env.NODE_ENV === 'production',
  dev: process.env.NODE_ENV === 'development',
  test: process.env.NODE_ENV === 'test',
};

export const server = {
  port: process.env.PORT ? parseInt(process.env.PORT, 10) : 6000,
};

export const tg = {
  token: process.env.TG_TOKEN,
  webhook: process.env.TG_WEBHOOK,
};

export const logging = {
  level: (process.env.LOG_LEVEL || 'info') as CLILoggingLevel,
};

const defaultDbConfig: Knex.Config = {
  client: 'pg',
  connection: process.env.PG_CONNECTION_STRING || {
    host: process.env.PG_HOST,
    port: process.env.PG_PORT ? parseInt(process.env.PG_PORT, 10) : 5432,
    database: process.env.PG_DATABASE,
    user: process.env.PG_USER,
    password: process.env.PG_PASSWORD,
  },
  pool: {
    min: 2,
    max: 10,
  },
  migrations: {
    extension: 'ts',
  },
};

export const db: { [env: string]: Knex.Config } = {
  production: {
    ...defaultDbConfig,
    migrations: {
      extension: 'js',
    },
  },

  development: {
    ...defaultDbConfig,
    connection: process.env.PG_CONNECTION_STRING || {
      host: 'localhost',
      port: 6001,
      database: 'postgres',
      user: 'postgres',
      password: 'password12!',
    },
  },

  test: {
    ...defaultDbConfig,
  },
};
