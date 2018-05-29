import * as Knex from 'knex';

export const up = async (knex: Knex) => {
  await knex.schema.createTable('expls', (t) => {
    t.increments('id')
      .primary();
    t.timestamp('created_at')
      .defaultTo(knex.fn.now());

    t.string('key', 50)
      .notNullable();
    t.string('value', 250);
    t.integer('tg_message_id');

    t.integer('tg_user_id')
      .notNullable();
    t.string('tg_username')
      .comment('Username which was used when the expl was created')
      .notNullable();
    t.bigInteger('tg_chat_id');

    t.integer('echo_count')
      .defaultTo(0)
      .comment('How many times this expl has been requested');
    t.timestamp('last_echo')
      .comment('Last time this expl was echoed somewhere');

    t.unique(['tg_user_id', 'key']);
  });

  await knex.schema.raw(`
    ALTER TABLE expls
    ADD CONSTRAINT value_xor_message_exists
    CHECK ((value IS NOT NULL AND tg_message_id is NULL) OR (tg_message_id IS NOT NULL AND value is NULL))
  `);

  await knex.schema.raw(`
    ALTER TABLE expls
    ADD CONSTRAINT tg_message_id_exists_with_tg_chat_id
    CHECK (tg_message_id IS NULL OR (tg_message_id IS NOT NULL AND tg_chat_id is NOT NULL))
  `);

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
