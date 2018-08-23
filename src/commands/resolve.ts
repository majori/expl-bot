
import * as _ from 'lodash';
import * as db from '../database';
import { Context } from '../types/telegraf';

const resolveRexpl = async (ctx: Context) => {
  if (ctx.message!.reply_to_message) {
    const echo = ctx.message!.reply_to_message!.message_id;

    const foundResolve = await db.getResolve(ctx.state.user, echo);

    if (foundResolve) {
      return ctx.reply(foundResolve.key);
    }
  }
};

export default resolveRexpl;
