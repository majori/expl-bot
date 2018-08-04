import * as Knex from 'knex';

export const up = async (knex: Knex) => {
  await knex.schema.alterTable('expls', (t) => {
    t.string('value', 500).alter();
  });
};

export const down = async (knex: Knex) => {
  await knex.schema.alterTable('expls', (t) => {
    t.string('value', 250).alter();
  });
};
