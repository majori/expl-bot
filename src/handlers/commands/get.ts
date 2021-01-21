import * as _ from 'lodash';
import type { Message } from 'typegram';

import * as db from '../../database';
import * as messages from '../../constants/messages';
import { sendExpl } from '../../utils';
import type { Context } from '../../types/telegraf';

export async function getExpl(ctx: Context) {
  const message = ctx.message as Message.TextMessage;
  const words = message.text.split(' ');

  if (words.length < 2 || _.isEmpty(words[1])) {
    return ctx.replyWithMarkdown(messages.get.invalidSyntax(_.first(words)));
  }
  const offset = _.chain(words).get(2, 0).toNumber().value() || 0;

  const foundExpl = await db.getExpl(ctx.from!.id, words[1], offset);
  await sendExpl(ctx, words[1], foundExpl);
}

export async function getRandomExpl(ctx: Context) {
  const foundExpl = _.first(await db.getRandomExpls(ctx.from!.id));

  if (!foundExpl) {
    return ctx.reply(messages.get.noExpls());
  }

  await sendExpl(ctx, foundExpl.key, foundExpl, true);
}
