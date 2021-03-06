import * as _ from 'lodash';
import type { Message } from 'typegram';

import * as db from '../../database';
import * as messages from '../../constants/messages';
import type { Context } from '../../types/telegraf';

export async function removeExpl(ctx: Context) {
  const message = ctx.message as Message.TextMessage;
  const words = message.text.split(' ');

  if (words.length < 2 || _.isEmpty(words[1])) {
    return ctx.replyWithMarkdown(messages.remove.invalidSyntax(_.first(words)));
  }
  const key = _.toLower(words[1]);
  const count = await db.deleteExpl(ctx.from!.id, key);

  return count > 0
    ? ctx.reply(messages.remove.successful(key))
    : ctx.reply(messages.errors.notFound(key));
}
