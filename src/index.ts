import * as config from './config';
import createBot from './bot';
import Telegraf from 'telegraf';
import Logger from './logger';
import * as express from 'express';

const logger = new Logger(__filename);

async function start() {
  const bot = await createBot(new Telegraf(config.tg.token!));
  const server = express();

  if (config.tg.webhook) {
    const path = `/bot${config.tg.token}`;
    const url = `${config.tg.webhook}${path}`;
    server.use(bot.webhookCallback(path));
    await bot.telegram.setWebhook(url);
    logger.info(`Webhook set to ${url}`);
  } else {
    await bot.telegram.deleteWebhook();
    bot.startPolling();
    logger.info('Polling started for updates');
  }

  // TODO: Health check endpoint

  server.listen(config.tg.port, () => {
    logger.info(`Server listening on port ${config.tg.port}`);
  });
}

start();
