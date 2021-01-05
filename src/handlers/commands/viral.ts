import * as _ from 'lodash';
import * as db from '../../database';
import type { Context } from '../../types/telegraf';
import * as messages from '../../constants/messages';

export async function getMostViral(ctx: Context) {
  const items = await db.getMostViral(ctx.from!.id);

  if (items.length < 2) {
    return ctx.reply(messages.viral.notEnoughData());
  }

  const itemsToString = items.map((expl, index) => {
    return `${1 + index}. ${expl.key}`;
  });

  return ctx.reply([messages.viral.lead(), ...itemsToString].join('\n'));
}
