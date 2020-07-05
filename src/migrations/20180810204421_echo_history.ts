import * as Knex from 'knex';

export async function up(knex: Knex): Promise<any> {
  await knex.schema.createTable('echo_history', (t) => {
    t.increments('id').primary();
    t.integer('expl_id')
      .unsigned()
      .references('id')
      .inTable('expls')
      .onDelete('CASCADE');
    t.integer('user_id');
    t.bigInteger('chat_id');
    t.timestamp('echoed_at').defaultTo(knex.fn.now()).nullable();
  });
}

export async function down(knex: Knex): Promise<any> {
  await knex.schema.dropTable('echo_history');
}
