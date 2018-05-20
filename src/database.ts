import * as _knex from 'knex';
import config from './config';

export const knex = _knex(config.env.prod ? config.db.production : config.db.development);
