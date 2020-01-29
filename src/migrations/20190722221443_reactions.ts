import * as Knex from 'knex';

export const up = async (knex: Knex) => {
  await knex.schema.createTable('reactions', (t) => {
    t.increments('id').primary();
    t.timestamp('created_at')
      .defaultTo(knex.fn.now());
    t.integer('expl_id')
      .unsigned()
      .references('id')
      .inTable('expls')
      .onDelete('CASCADE');
    t.integer('user_id')
      .notNullable();
    t.string('reaction', 2)
      .comment('Emoji')
      .notNullable();
    t.unique(['expl_id', 'user_id', 'reaction']);
    t.index(['expl_id', 'reaction']);
  });
};

export const down = async (knex: Knex) => {
  await knex.schema.dropTable('reactions');
};
