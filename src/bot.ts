import * as _ from 'lodash';
import { Telegraf } from 'telegraf';
import { Context } from './types/telegraf';
import config from './config';
import * as commands from './commands';

export default async (bot: Telegraf<Context>) => {
  const info = await bot.telegram.getMe();
  bot.options.username = info.username;

  bot.use((ctx, next) => {
    ctx.state = {
      user: _.get(ctx, 'from.id'),
      chat: _.get(ctx, 'chat.id'),
    };
    next!();
  });

  bot.command('/expl', commands.getExpl);
  bot.hears('??', commands.getExpl);
  bot.hears((text: string) => text.substring(0, 3) === '?? ', commands.getExpl);

  bot.command('/rexpl', commands.getRandomExpl);
  bot.hears('?!', commands.getRandomExpl);

  bot.command('/add', commands.createExpl);
  bot.hears('!add', commands.createExpl);

  bot.command('/join', commands.joinGroup);

  bot.on('inline_query', async (ctx) => {
    const results = [
      {
        type: 'article',
        id: 'addi1',
        title: 'addi1',
        input_message_content: {
          message_text: '?? addi1',
        },
      },
      {
        type: 'article',
        id: 'addi2',
        title: 'addi2',
        input_message_content: {
          message_text: '?? addi2',
        },
      },
      {
        type: 'article',
        id: 'addi3',
        title: 'addi3',
        input_message_content: {
          message_text: '?? addi3',
        },
      },
    ];
    return ctx.answerInlineQuery(results);
  });

  return bot;
};
