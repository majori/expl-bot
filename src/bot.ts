import * as _ from 'lodash';
import * as session from 'telegraf/session';
import logger from './logger';
import commands from './handlers/commands';
import events from './handlers/events';
import * as db from './database';
import type { Telegraf } from 'telegraf';
import type { Context } from './types/telegraf';

export default async (bot: Telegraf<Context>) => {
  const info = await bot.telegram.getMe();
  bot.options.username = info.username;

  bot.use((ctx, next) => {
    logger.debug('Message received', ctx.from);
    next();
  });

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

    next();
  });

  bot.start(commands.help);
  bot.help(commands.help);
  bot.hears(/^(\!h)/, commands.help);

  const commandHandlers: [string, RegExp, (ctx: Context) => Promise<any>][] = [
    ['/expl', /^(\?\? ).*$/, commands.expl],
    ['/rexpl', /^(\?\!)(| .*)$/, commands.rexpl],
    ['/add', /^(\!add ).*$/, commands.add],
    ['/remove', /^(\!rm ).*$/, commands.remove],
    ['/list', /^(\!ls ).*$/, commands.list],
    ['/resolve', /^(\!rs)(| .*)$/, commands.resolve],
    ['/quiz', /^(\!qz)(| .*)$/, commands.resolve],
    ['/me', /^(\!me)(| .*)$/, commands.me],
  ];

  for (const handler of commandHandlers) {
    bot.command(handler[0], handler[2]);
    bot.hears(handler[1], handler[2]);
  }

  bot.on('inline_query', events.inlineQuery);
  bot.on('poll_answer', events.pollAnswer);
  bot.action(/^reaction/, events.reaction);
  bot.action(/^medata/, events.me);

  return bot;
};
