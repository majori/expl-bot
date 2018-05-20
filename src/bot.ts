import { Telegraf } from 'telegraf';
import { Context } from './types/telegraf';
import config from './config';

export default async (bot: Telegraf<Context>) => {
  const info = await bot.telegram.getMe();
  bot.options.username = info.username;

  return bot;
};
