import * as Knex from 'knex';

export const up = async (knex: Knex) => {
  await knex.schema.alterTable('echo_history', (t) => {
    t.integer('echo_message_id');
  });
};

export const down = async (knex: Knex) => {
  await knex.schema.alterTable('echo_history', (t) => {
    t.dropColumn('echo_message_id');
  });
};
