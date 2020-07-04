import * as _ from 'lodash';
import * as session from 'telegraf/session';
import commands from './commands';
import handlers from './handlers';
import * as db from './database';
import type { Telegraf } from 'telegraf';
import type { Context } from './types/telegraf';

export default async (bot: Telegraf<Context>) => {
  const info = await bot.telegram.getMe();
  bot.options.username = info.username;

  bot.use(session());
  bot.use(async (ctx, next) => {
    // Autojoin user to the group if not joined already
    if (
      ctx.from &&
      ctx.chat &&
      ctx.chat.type !== 'private' &&
      !ctx.session.joined
    ) {
      await db.addUserToChat(ctx.from!.id, ctx.chat!.id);
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

  bot.on('inline_query', handlers.inlineQuery);
  bot.on('poll_answer' as any, handlers.pollAnswer);

  bot.action(/^reaction/, commands.reaction);

  return bot;
};
