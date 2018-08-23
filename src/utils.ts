import * as _ from 'lodash';
import { Context } from './types/telegraf';
import Logger from './logger';
import * as messages from './constants/messages';
import { addEcho } from './database';

const logger = new Logger(__filename);

export const sendExpl = async (ctx: Context, key: string, expl: Table.Expl | null, wasRandom: boolean = false) => {
  if (!expl) {
    return ctx.reply(messages.errors.notFound(key));
  }

  if (expl.value) {
    const sent = await ctx.reply(`${expl.key}: ${expl.value}`);
    await addEcho(expl, ctx.state, wasRandom, sent.message_id);
  }

  if (expl.tg_content) {
    const content = expl.tg_content;
    if (content.message_id && content.chat_id) {
      try {
        const sent = await ctx.telegram.forwardMessage(ctx.state.chat, +content.chat_id, content.message_id);
        await addEcho(expl, ctx.state, wasRandom, sent.message_id);
      } catch (err) {
        switch (err.description) {
          case 'Bad Request: chat not found':
          case 'Bad Request: message to forward not found':
            return ctx.reply(messages.get.forbidden());
          default:
            logger.error(err);
            return ctx.reply(messages.errors.unknownError());
        }
      }
    }
  }
};
