import Knex from 'knex';

export const up = async (knex: Knex) => {
  return knex.schema.createTable('expls', (t) => {
    t.increments('id')
      .primary();
    t.timestamp('created_at')
      .defaultTo(knex.fn.now());
    t.integer('creator_id');

    t.string('key', 50);
    t.string('value', 250);

    t.integer('tg_message_id');
    t.integer('tg_chat_id');

    t.integer('echo_count')
      .defaultTo(0)
      .comment('How many times this expl has been requested');

    t.timestamp('last_echo')
      .nullable()
      .comment('Last time this expl was echoed somewhere');
  });
};

export const down = async (knex: Knex) => {
  return knex.schema.dropTable('expls');
};
