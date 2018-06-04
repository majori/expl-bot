import * as _ from 'lodash';
import { Telegraf } from 'telegraf';
import { Context } from './types/telegraf';
import config from './config';
import * as commands from './commands';

export default async (bot: Telegraf<Context>) => {
  const info = await bot.telegram.getMe();
  bot.options.username = info.username;

  bot.use((ctx, next) => {
    // HACK: Reject "mobi" chat because of reasons
    if (_.get(ctx, 'chat.id') !== -8573374) {
      (next as any)();
    }
  });

  bot.use((ctx, next) => {
    ctx.state = {
      user: _.get(ctx, 'from.id'),
      chat: _.get(ctx, 'chat.id'),
    };
    next!();
  });

  bot.command('/expl', commands.getExpl);
  bot.hears(/^(\?\? ).*$/, commands.getExpl);

  bot.command('/rexpl', commands.getRandomExpl);
  bot.hears(/^(\?\!).*$/, commands.getRandomExpl);

  bot.command('/add', commands.createExpl);
  bot.hears(/^(\!add ).*$/, commands.createExpl);

  bot.command('/remove', commands.removeExpl);
  bot.hears(/^(\!rm ).*$/, commands.removeExpl);

  bot.command('/join', commands.joinGroup);

  bot.on('inline_query', commands.searchExpl);

  return bot;
};
