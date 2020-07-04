import * as Knex from 'knex';

export const up = async (knex: Knex) => {
  await knex.schema.createTable('tg_contents', (t) => {
    t.increments('content_id').primary();
    t.integer('message_id');
    t.bigInteger('chat_id');
    t.string('sticker_id');
    t.string('audio_id');
    t.string('photo_id');
    t.string('video_id');
  });

  await knex.schema.raw(`
    ALTER TABLE tg_contents
    ADD CONSTRAINT message_id_exists_with_chat_id
    CHECK (message_id IS NULL OR (message_id IS NOT NULL AND chat_id is NOT NULL))
  `);

  await knex.schema.createTable('expls', (t) => {
    t.increments('id').primary();
    t.timestamp('created_at').defaultTo(knex.fn.now());

    t.integer('user_id').notNullable();
    t.string('key', 50).notNullable();
    t.string('value', 250);

    t.integer('tg_content')
      .unsigned()
      .references('content_id')
      .inTable('tg_contents')
      .onDelete('CASCADE');

    t.integer('echo_count')
      .defaultTo(0)
      .comment('How many times this expl has been requested');
    t.timestamp('last_echo').comment(
      'Last time this expl was echoed somewhere',
    );

    t.unique(['user_id', 'key']);
  });

  await knex.schema.raw(`
    ALTER TABLE expls
    ADD CONSTRAINT value_xor_tg_content_exists
    CHECK ((value IS NOT NULL AND tg_content is NULL) OR (tg_content IS NOT NULL AND value is NULL))
  `);

  await knex.schema.createTable('auth', (t) => {
    t.increments('id').primary();
    t.integer('user_id').notNullable();
    t.bigInteger('chat_id').notNullable();

    t.unique(['user_id', 'chat_id']);
  });
};

export const down = async (knex: Knex) => {
  await knex.schema.dropTable('expls');
  await knex.schema.dropTable('tg_contents');
  await knex.schema.dropTable('auth');
};
