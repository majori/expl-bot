import * as _ from 'lodash';
import * as db from '../database';
import { Context } from '../types/telegraf';
import * as messages from '../constants/messages';

export const removeExpl = async (ctx: Context) => {
  const words = ctx.message!.text!.split(' ');

  if (words.length < 2 || _.isEmpty(words[1])) {
    return ctx.replyWithMarkdown(messages.remove.invalidSyntax(_.first(words)));
  }
  const key = _.toLower(words[1]);
  const count = await db.deleteExpl(ctx.state.user, key);

  return count > 0
    ? ctx.reply(messages.remove.successful(key))
    : ctx.reply(messages.errors.notFound(key));
};
