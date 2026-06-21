import * as sinon from 'sinon';
import { Telegraf } from 'telegraf';
import knexFactory from 'knex';
import type { UserFromGetMe } from '@telegraf/types';

import createBot from '../src/bot';
import * as config from '../src/config';

export const knex = knexFactory(config.db.test);

export const botInfo: UserFromGetMe = {
  id: 123456789,
  is_bot: true,
  first_name: 'test_expl_tg_bot',
  username: 'test_expl_tg_bot',
  can_join_groups: true,
  can_read_all_group_messages: false,
  supports_inline_queries: true,
};

export async function createTestableBot() {
  const bot = new Telegraf('test_token');

  // Add here all necessary stubs
  sinon.stub(bot.telegram, 'getMe').resolves(botInfo);

  return createBot(bot);
}

export async function migrateAllDown(): Promise<void> {
  const version = await knex.migrate.currentVersion();
  if (version !== 'none') {
    await knex.migrate.rollback({ directory: './src/migrations' });
    return migrateAllDown();
  }
}

export async function clearDb() {
  await migrateAllDown();
  await knex.migrate.latest({ directory: './src/migrations' });
}
