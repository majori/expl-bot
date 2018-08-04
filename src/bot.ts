import * as _ from 'lodash';
import { Telegraf } from 'telegraf';
import * as session from 'telegraf/session';
import { Context } from './types/telegraf';
import * as commands from './commands';
import * as db from './database';

export default async (bot: Telegraf<Context>) => {
  const info = await bot.telegram.getMe();
  bot.options.username = info.username;

  bot.use(session());
  bot.use(async (ctx, next) => {
    ctx.state = {
      user: _.get(ctx, 'from.id'),
      chat: _.get(ctx, 'chat.id'),
    };

    // Autojoin user to the group if not joined already
    if (ctx.from && ctx.chat && ctx.chat.type !== 'private' && !ctx.session.joined) {
      await db.addUserToChat(ctx.state.user, ctx.state.chat);
      ctx.session.joined = true;
    }

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

  // bot.command('/list', commands.searchExpls);
  // bot.hears(/^(\!ls ).*$/, commands.searchExpls);

  bot.on('inline_query', commands.handleInlineQuery);

  return bot;
};
