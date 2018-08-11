import * as sinon from 'sinon';
import * as Telegraf from 'telegraf';
import * as Knex from 'knex';
import createBot from '../src/bot';
import config from '../src/config';

export const knex = Knex(config.db.test);

export const botInfo = {
  id: 123456789,
  is_bot: true,
  first_name: 'test_expl_tg_bot',
  username: 'test_expl_tg_bot',
};

export async function createTestableBot() {
  const bot = new (Telegraf as any)('test_token');

  // Add here all necessary stubs
  sinon.stub(bot.telegram, 'getMe').resolves(botInfo);

  return createBot(bot);
}

export async function migrateAllDown(): Promise<void> {
  const version = await knex.migrate.currentVersion();
  if (version !== 'none') {
    await knex.migrate.rollback();
    return migrateAllDown();
  }
}

export const clearDb = async () => {
  await migrateAllDown();
  await knex.migrate.latest();
};
