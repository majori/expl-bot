import * as Knex from 'knex';

export const up = async (knex: Knex) => {
  await knex.schema.createTable('expls', (t) => {
    t.increments('id')
      .primary();
    t.timestamp('created_at')
      .defaultTo(knex.fn.now());

    t.string('key', 50);
    t.string('value', 250);

    t.integer('tg_user_id');
    t.integer('tg_message_id');
    t.bigInteger('tg_chat_id');

    t.integer('echo_count')
      .defaultTo(0)
      .comment('How many times this expl has been requested');
    t.timestamp('last_echo')
      .nullable()
      .comment('Last time this expl was echoed somewhere');
  });
  await knex.schema.createTable('auth', (t) => {
    t.increments('id')
      .primary();
    t.integer('tg_user_id');
    t.bigInteger('tg_chat_id');

    t.unique(['tg_user_id', 'tg_chat_id']);
  });

};

export const down = async (knex: Knex) => {
  await knex.schema.dropTable('expls');
  await knex.schema.dropTable('auth');
};
