import * as _ from 'lodash';
import * as db from '../database';
import { Context } from '../types/telegraf';
import { escapeMarkdown, formatDate } from '../utils';
import { reactionsKeyboard } from './reaction';
import * as messages from '../constants/messages';

export const resolveRexpl = async (ctx: Context) => {
  if (!ctx.message!.reply_to_message) {
    return ctx.reply(messages.resolve.noReply());
  }

  const echo = ctx.message!.reply_to_message.message_id;
  const expl = await db.getResolve(ctx.state, echo);

  if (!expl) {
    return ctx.reply(messages.resolve.notExpl());
  }

  const key = await escapeMarkdown(expl.key);
  const date = await formatDate(expl.created_at);

  const keyboard = await reactionsKeyboard(expl.id);

  await ctx.replyWithMarkdown(`${key}, _${date}_`, {
    reply_markup: keyboard,
  });
};
