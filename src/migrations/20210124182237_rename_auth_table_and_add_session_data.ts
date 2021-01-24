import * as Knex from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('auth', (t) => {
    t.dropPrimary();
    t.dropUnique(['user_id', 'chat_id']);
    t.dropColumn('id');
  });
  await knex.schema.renameTable('auth', 'sessions');
  await knex.schema.alterTable('sessions', (t) => {
    t.primary(['user_id', 'chat_id']);
    t.json('session');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('sessions', (t) => {
    t.dropColumn('session');
    t.dropPrimary();
  });
  await knex.schema.renameTable('sessions', 'auth');
  await knex.schema.alterTable('auth', (t) => {
    t.increments('id').primary();
    t.unique(['user_id', 'chat_id']);
  });
}
