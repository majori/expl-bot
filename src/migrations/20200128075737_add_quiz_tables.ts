import * as Knex from 'knex';

export async function up(knex: Knex): Promise<any> {
  await knex.schema.createTable('quizzes', (t) => {
    t.string('id').primary();
    t.integer('correct_expl_id')
      .unsigned()
      .references('id')
      .inTable('expls')
      .onDelete('CASCADE');
    t.integer('correct_option_index').unsigned();
    t.integer('creator_user_id');
    t.bigInteger('chat_id');
    t.timestamp('created_at').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('quiz_answers', (t) => {
    t.increments('id').primary();
    t.string('quiz_id').references('id').inTable('quizzes').onDelete('CASCADE');
    t.integer('user_id');
    t.boolean('was_correct');
    t.timestamp('created_at').defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<any> {
  await knex.schema.dropTable('quiz_answers');
  await knex.schema.dropTable('quizzes');
}
