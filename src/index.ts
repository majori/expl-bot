import { Telegraf } from 'telegraf';
import * as express from 'express';

import * as config from './config';
import createBot from './bot';
import logger from './logger';
import { knex } from './database';
import type { Context } from './types/telegraf';

async function start() {
  const bot = await createBot(
    new Telegraf<Context>(config.tg.token!, {
      telegram: { webhookReply: false },
    }),
  );
  const server = express();

  if (config.tg.webhook) {
    const token = config.tg.token!;
    const path = `/bot${token}`;
    const url = `${config.tg.webhook}${path}`;

    server.use(bot.webhookCallback(path));
    await bot.telegram.setWebhook(url);

    const sanitizedUrl = url.replace(
      token.slice(3, -3),
      '*'.repeat(token.length - 6),
    );
    logger.info(`Webhook set to ${sanitizedUrl}`);
  } else {
    await bot.launch();
    logger.info('Polling started for updates');
  }

  server.get('/health', async (req, res) => {
    try {
      await knex.raw('SELECT 1');
      res.send('ok');
    } catch (err) {
      res.status(500);
    }
  });

  // Respond "forbidden" on all non-defined routes
  server.use((req, res) => {
    res.status(403).send();
  });

  server.listen(config.server.port, () => {
    logger.info(`Server listening on port ${config.server.port}`);
  });
}

start();
