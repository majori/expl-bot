import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<any> {
  await knex.schema.alterTable('echo_history', (t: Knex.AlterTableBuilder) => {
    t.boolean('was_random').defaultTo(false);
  });
}

export async function down(knex: Knex): Promise<any> {
  await knex.schema.alterTable('echo_history', (t: Knex.AlterTableBuilder) => {
    t.dropColumn('was_random');
  });
}
