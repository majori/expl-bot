import * as sinon from 'sinon';
import * as Telegraf from 'telegraf';
import createBot from '../src/bot';

export const botInfo = {
  id: 123456789,
  is_bot: true,
  first_name: 'test_piikki_tg_bot',
  username: 'test_piikki_tg_bot',
};

export async function createTestableBot() {
  const bot = new (Telegraf as any)('test_token');

  // Add here all necessary stubs
  sinon.stub(bot.telegram, 'getMe').resolves(botInfo);

  return createBot(bot);
}

export function contextBuilder() {
  return {
    state: {
      username: 'user',
    },
    reply: sinon.spy(),
  };
}
