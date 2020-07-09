import * as _ from 'lodash';
import * as db from '../database';
import type { Context } from '../types/telegraf';
import * as messages from '../constants/messages';
import { inlineSearchKeyboard } from '../utils';

export const MAX_COUNT = 100;

export async function searchExpls(ctx: Context) {
  const words = ctx.message!.text!.split(' ');
  if (words.length < 2 || _.isEmpty(words[1])) {
    return ctx.replyWithMarkdown(messages.list.invalidSyntax(_.first(words)));
  }

  const searchTerm = words[1];
  const result = await db.searchExpls(ctx.from!.id, searchTerm);

  const extraMarkup = await inlineSearchKeyboard(searchTerm);

  if (_.isEmpty(result)) {
    return ctx.reply(messages.list.notFound(searchTerm), extraMarkup);
  }

  const uniqueKeys = _.groupBy(result, 'key');
  if (_.size(uniqueKeys) > MAX_COUNT) {
    return ctx.reply(messages.list.tooMany(searchTerm), extraMarkup);
  }

  const keys = _.reduce(
    uniqueKeys,
    (memo: string[], rows, key) => {
      memo.push(key + (_.size(rows) > 1 ? ` [${_.size(rows)}]` : ''));
      return memo;
    },
    [],
  );

  return ctx.reply(_.join(keys, ', '), extraMarkup);
}
