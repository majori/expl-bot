import * as _ from 'lodash';
import { session } from 'telegraf';
import type { Telegraf } from 'telegraf';

import logger from './logger';
import commands from './handlers/commands';
import events from './handlers/events';
import * as db from './database';
import type { Context } from './types/telegraf';

export default async (bot: Telegraf<Context>) => {
  bot.use((ctx, next) => {
    logger.debug('Message received', ctx.from);
    next();
  });

  bot.use(session());
  bot.use(async (ctx, next) => {
    if (ctx.from?.id && ctx.chat?.id && ctx.chat?.type !== 'private') {
      await db.addUserToChat(ctx.from.id, ctx.chat!.id);
    }

    next();
  });

  bot.start(commands.help);
  bot.help(commands.help);
  bot.hears(/^(\!h)(| .*)$/, commands.help);

  const commandHandlers: [string, RegExp, (ctx: Context) => Promise<any>][] = [
    ['/expl', /^(\?\? ).*$/, commands.expl],
    ['/rexpl', /^(\?\!)(| .*)$/, commands.rexpl],
    ['/add', /^(\!add ).*$/, commands.add],
    ['/remove', /^(\!rm ).*$/, commands.remove],
    ['/list', /^(\!ls ).*$/, commands.list],
    ['/resolve', /^(\!rs)(| .*)$/, commands.resolve],
    ['/quiz', /^(\!qz)(| .*)$/, commands.quiz],
    ['/me', /^(\!me)(| .*)$/, commands.me],
    ['/viral', /^(\!vrl)(| .*)$/, commands.viral],
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
