import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<any> {
  await knex.schema.alterTable('echo_history', (t: Knex.AlterTableBuilder) => {
    t.integer('echo_message_id');
  });
}

export async function down(knex: Knex): Promise<any> {
  await knex.schema.alterTable('echo_history', (t: Knex.AlterTableBuilder) => {
    t.dropColumn('echo_message_id');
  });
}
