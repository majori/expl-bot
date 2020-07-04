import * as messages from '../constants/messages';
import type { Context } from '../types/telegraf';

export const printHelp = (ctx: Context) => {
  if (ctx.chat && ctx.chat.type === 'private') {
    return ctx.replyWithMarkdown(messages.help());
  }
};
