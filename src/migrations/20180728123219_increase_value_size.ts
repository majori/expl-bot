import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<any> {
  await knex.schema.alterTable('expls', (t: Knex.AlterTableBuilder) => {
    t.string('value', 500).alter();
  });
}

export async function down(knex: Knex): Promise<any> {
  await knex.schema.alterTable('expls', (t: Knex.AlterTableBuilder) => {
    t.string('value', 250).alter();
  });
}
