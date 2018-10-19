import * as messages from '../constants/messages';
import { Context } from '../types/telegraf';

export default (ctx: Context) => {
  if (ctx.chat && ctx.chat.type === 'private') {
    return ctx.replyWithMarkdown(messages.help());
  }
};
