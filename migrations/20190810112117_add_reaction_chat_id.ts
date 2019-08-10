import * as Knex from 'knex';

export const up = async (knex: Knex) => {
  await knex.schema.alterTable('reactions', (t) => {
    t.bigInteger('chat_id');
  });
};

export const down = async (knex: Knex) => {
  await knex.schema.alterTable('reactions', (t) => {
    t.dropColumn('chat_id');
  });
};
