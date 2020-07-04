import * as config from './config';
import createBot from './bot';
import Telegraf from 'telegraf';
import Logger from './logger';

const logger = new Logger(__filename);

async function start() {
  const bot = await createBot(new Telegraf(config.tg.token!));

  if (config.tg.webhook) {
    const webhook = `${config.tg.webhook}/bot${config.tg.token}`;
    await bot.telegram.setWebhook(webhook);
    bot.startWebhook(`/bot${config.tg.token}`, null, config.tg.port);
    logger.info(`Webhook listening at ${webhook}`);
  } else {
    await bot.telegram.deleteWebhook();
    await bot.startPolling();
    logger.info('Polling started for updates');
  }
}

start();
