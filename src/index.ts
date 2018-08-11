import config from './config';
import createBot from './bot';
import * as Telegraf from 'telegraf';
import Logger from './logger';

const logger = new Logger(__filename);

async function start() {
  const options = { telegram: { webhookReply: false } };
  const bot = await createBot(new (Telegraf as any)(config.tg.token!, options));

  // Setup webhook if production
  if (config.env.prod && config.tg.webhook) {
    const webhook = `${config.tg.webhook}/bot${config.tg.token}`;
    await bot.telegram.setWebhook(webhook);
    await bot.startWebhook(`/bot${config.tg.token}`, null as any, config.tg.port);
    logger.info(`Webhook listening at ${webhook}`);

  // Do polling in development
  } else {
    await bot.telegram.deleteWebhook();
    await bot.startPolling();
    logger.info('Polling started for updates');
  }
}

start();
