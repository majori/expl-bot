import * as _ from 'lodash';
import * as db from '../database';
import type { Context } from '../types/telegraf';
import * as messages from '../constants/messages';

export async function getKarma(ctx: Context) {
  const karma = await db.getUserKarma(ctx.from!.id);
  return ctx.reply(messages.karma.display(karma));
}
