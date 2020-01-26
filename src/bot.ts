import * as _ from 'lodash';
import { Telegraf } from 'telegraf';
import * as session from 'telegraf/session';
import { Context } from './types/telegraf';
import commands from './commands';
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
    if (
      ctx.from &&
      ctx.chat &&
      ctx.chat.type !== 'private' &&
      !ctx.session.joined
    ) {
      await db.addUserToChat(ctx.state.user, ctx.state.chat);
      ctx.session.joined = true;
    }

    next!();
  });

  bot.start(commands.help);
  bot.help(commands.help);
  bot.hears(/^(\!h)/, commands.help);

  bot.command('/expl', commands.expl);
  bot.hears(/^(\?\? ).*$/, commands.expl);

  bot.command('/rexpl', commands.rexpl);
  bot.hears(/^(\?\!).*$/, commands.rexpl);

  bot.command('/add', commands.add);
  bot.hears(/^(\!add ).*$/, commands.add);

  bot.command('/remove', commands.remove);
  bot.hears(/^(\!rm ).*$/, commands.remove);

  bot.command('/list', commands.list);
  bot.hears(/^(\!ls ).*$/, commands.list);

  bot.command('/resolve', commands.resolve);
  bot.hears(/^(\!rs).*$/, commands.resolve);

  bot.command('/quiz', commands.quiz);
  bot.hears(/^(\!qz).*$/, commands.quiz);

  bot.on('inline_query', commands.inlineQuery);

  bot.action(/^reaction/, commands.reaction);

  return bot;
};
