import * as Knex from 'knex';

export async function up(knex: Knex): Promise<any> {
  await knex.schema.alterTable('echo_history', (t) => {
    t.integer('echo_message_id');
  });
}

export async function down(knex: Knex): Promise<any> {
  await knex.schema.alterTable('echo_history', (t) => {
    t.dropColumn('echo_message_id');
  });
}
