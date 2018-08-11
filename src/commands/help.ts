import * as messages from '../constants/messages';
import { Context } from '../types/telegraf';

export default (ctx: Context) => {
  return ctx.replyWithMarkdown(messages.help());
};
