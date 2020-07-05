import * as Knex from 'knex';

export async function up(knex: Knex): Promise<any> {
  await knex.schema.alterTable('echo_history', (t) => {
    t.boolean('was_random').defaultTo(false);
  });
}

export async function down(knex: Knex): Promise<any> {
  await knex.schema.alterTable('echo_history', (t) => {
    t.dropColumn('was_random');
  });
}
