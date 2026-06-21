import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<any> {
  await knex.schema.alterTable('reactions', (t: Knex.AlterTableBuilder) => {
    t.bigInteger('chat_id');
  });
}

export async function down(knex: Knex): Promise<any> {
  await knex.schema.alterTable('reactions', (t: Knex.AlterTableBuilder) => {
    t.dropColumn('chat_id');
  });
}
