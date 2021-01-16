import * as config from './config';
import createBot from './bot';
import { Telegraf } from 'telegraf';
import logger from './logger';
import { knex } from './database';
import * as express from 'express';
import type { Context } from './types/telegraf';

async function start() {
  const bot = await createBot(
    new Telegraf<Context>(config.tg.token!, {
      telegram: { webhookReply: false },
    }),
  );
  const server = express();

  if (config.tg.webhook) {
    const path = `/bot${config.tg.token}`;
    const url = `${config.tg.webhook}${path}`;
    server.use(bot.webhookCallback(path));
    await bot.telegram.setWebhook(url);
    logger.info(`Webhook set to ${url}`);
  } else {
    logger.info('Polling started for updates');
  }

  await bot.launch();

  server.get('/health', async (req, res) => {
    try {
      await knex.raw('SELECT 1');
      res.send('ok');
    } catch (err) {
      res.status(500);
    }
  });

  server.listen(config.server.port, () => {
    logger.info(`Server listening on port ${config.server.port}`);
  });
}

start();
