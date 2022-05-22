import * as Knex from 'knex';

// Tables with same column name/type
const tables = [
  'auth',
  'echo_history',
  'expls',
  'quiz_answers',
  'reactions',
  'resolve_history',
];

export async function up(knex: Knex): Promise<void> {
  for (let table of tables) {
    await knex.schema.alterTable(table, (t) => {
      t.bigInteger('user_id').notNullable().alter();
    });
  }

  await knex.schema.alterTable('quizzes', (t) => {
    t.bigInteger('creator_user_id').notNullable().alter();
  });

  await knex.schema.alterTable('karma', (t) => {
    t.dropPrimary();
  });

  await knex.schema.alterTable('karma', (t) => {
    t.bigInteger('user_id').primary().alter();
  });
}

export async function down(knex: Knex): Promise<void> {
  for (let table of tables) {
    await knex.schema.alterTable(table, (t) => {
      t.integer('user_id').notNullable().alter();
    });
  }

  await knex.schema.alterTable('quizzes', (t) => {
    t.integer('creator_user_id').notNullable().alter();
  });

  await knex.schema.alterTable('karma', (t) => {
    t.dropPrimary();
  });

  await knex.schema.alterTable('karma', (t) => {
    t.string('user_id').primary().alter();
  });
}
