
import * as _ from 'lodash';
import * as db from '../database';
import { Context } from '../types/telegraf';
import { escapeMarkdown, formatDate } from '../utils';

const resolveRexpl = async (ctx: Context) => {
  if (ctx.message!.reply_to_message) {
    const echo = ctx.message!.reply_to_message!.message_id;

    const foundResolve = await db.getResolve(ctx.state, echo);

    if (foundResolve) {
      const key = await escapeMarkdown(foundResolve.key);
      const date = await formatDate(foundResolve.created_at);
      await ctx.replyWithMarkdown(`${key}, _${date}_`);
    }
  }
};

export default resolveRexpl;
