import * as _ from 'lodash';
import { Context } from './types/telegraf';
import { Table } from './types/database';
import Logger from './logger';
import * as messages from './constants/messages';
import { addEcho } from './database';

const logger = new Logger(__filename);

export const sendExpl = async (
  ctx: Context,
  key: string,
  expl: Table.Expl | null,
  wasRandom: boolean = false,
) => {
  if (!expl) {
    return ctx.reply(messages.errors.notFound(key));
  }

  if (expl.value) {
    const sent = await ctx.reply(expl.value);
    await addEcho(
      expl,
      { user: ctx.from!.id, chat: ctx.chat!.id },
      wasRandom,
      sent.message_id,
    );
    return sent;
  }

  if (expl.tg_content) {
    const content = expl.tg_content;
    if (content.message_id && content.chat_id) {
      try {
        const sent = await ctx.telegram.forwardMessage(
          ctx.chat!.id,
          +content.chat_id,
          content.message_id,
        );
        await addEcho(
          expl,
          { user: ctx.from!.id, chat: ctx.chat!.id },
          wasRandom,
          sent.message_id,
        );
        return sent;
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

export const escapeMarkdown = async (msg: string) => {
  return msg
    .replace(/\_/g, '\\_')
    .replace(/\*/g, '\\*')
    .replace(/\[/g, '\\[')
    .replace(/\`/g, '\\`');
};

export const formatDate = async (date: string) => {
  const d = new Date(date);
  const dd = d.getDate();
  const mm = 1 + d.getMonth();
  const yyyy = d.getFullYear();

  return [dd, mm, yyyy].join('.');
};

export const inlineSearchKeyboard = async (searchTerm: string) => ({
  reply_markup: {
    inline_keyboard: [
      [
        {
          text: 'Search with inline query',
          switch_inline_query_current_chat: searchTerm,
        },
      ],
    ],
  },
});
