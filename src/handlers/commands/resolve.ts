import * as _ from 'lodash';
import * as db from '../../database';
import type { Context } from '../../types/telegraf';
import { escapeMarkdown, formatDate } from '../../utils';
import { reactionsKeyboard } from '../events/reaction';
import * as messages from '../../constants/messages';

export async function resolveRexpl(ctx: Context) {
  if (!ctx.message!.reply_to_message) {
    return ctx.reply(messages.resolve.noReply());
  }

  const echo = ctx.message!.reply_to_message.message_id;
  const expl = await db.getResolve(
    { user: ctx.from!.id, chat: ctx.chat!.id },
    echo,
  );

  if (!expl) {
    return ctx.reply(messages.resolve.notExpl());
  }

  const key = await escapeMarkdown(expl.key);
  const date = await formatDate(expl.created_at);

  const keyboard = await reactionsKeyboard(expl.id);

  await ctx.replyWithMarkdown(`${key}, _${date}_`, {
    reply_markup: keyboard,
  });
}
