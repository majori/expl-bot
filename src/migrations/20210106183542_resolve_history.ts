import * as Knex from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('resolve_history', (t) => {
    t.increments('id').primary();
    t.integer('echo_id')
      .unsigned()
      .references('id')
      .inTable('echo_history')
      .onDelete('CASCADE');
    t.integer('user_id');
    t.timestamp('resolved_at').defaultTo(knex.fn.now()).nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('resolve_history');
}
