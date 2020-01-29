import * as Knex from 'knex';

export const up = async (knex: Knex) => {
  await knex.schema.alterTable('echo_history', (t) => {
    t.boolean('was_random')
      .defaultTo(false);
  });
};

export const down = async (knex: Knex) => {
  await knex.schema.alterTable('echo_history', (t) => {
    t.dropColumn('was_random');
  });
};
