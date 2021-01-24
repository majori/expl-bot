import * as _ from 'lodash';
import type { Message } from 'typegram';

import * as db from '../../database';
import { escapeMarkdown, formatDate } from '../../utils';
import { reactionsKeyboard } from '../events/reaction';
import * as messages from '../../constants/messages';
import type { Context } from '../../types/telegraf';

export async function resolveRexpl(ctx: Context) {
  const message = ctx.message as Message.TextMessage;

  if (!message.reply_to_message) {
    return ctx.reply(messages.resolve.noReply());
  }

  const echo = message.reply_to_message.message_id;
  const expl = await db.getResolve(
    { user: ctx.from!.id, chat: ctx.chat!.id },
    echo,
  );

  if (!expl) {
    return ctx.reply(messages.resolve.notExpl());
  }

  const key = escapeMarkdown(expl.key);
  const date = formatDate(expl.created_at);

  const keyboard = await reactionsKeyboard(expl.id);

  await ctx.replyWithMarkdown(`${key}, _${date}_`, {
    reply_markup: keyboard,
  });
}
