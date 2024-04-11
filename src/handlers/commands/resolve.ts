import * as _ from 'lodash';
import type { Message } from 'typegram';

import * as db from '../../database';
import { escapeMarkdown, formatYear } from '../../utils';
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
  const year = formatYear(expl.created_at);

  const chatMember = await ctx.getChatMember(expl.user_id);
  const explCreator = chatMember?.user.username;

  const reply = explCreator
    ? `${key}, _${explCreator.replace(/_/, '\\_')} ${year}_`
    : `${key}, _${year}_`;

  const keyboard = await reactionsKeyboard(expl.id);

  await ctx.replyWithMarkdown(reply, {
    reply_markup: keyboard,
  });
}
