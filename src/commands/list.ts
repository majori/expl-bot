
import * as _ from 'lodash';
import * as db from '../database';
import { Context } from '../types/telegraf';
import * as messages from '../constants/messages';

export const MAX_COUNT = 100;

const searchExpls = async (ctx: Context) => {
  const words = ctx.message!.text!.split(' ');
  if (words.length < 2 || _.isEmpty(words[1])) {
    return ctx.replyWithMarkdown(messages.list.invalidSyntax(_.first(words)));
  }

  const searchTerm = words[1];
  const result = await db.searchExpls(ctx.state.user, searchTerm);

  const extraMarkup = {
    reply_markup: {
      inline_keyboard: [
        [{
          text: 'Search with inline query',
          switch_inline_query_current_chat: searchTerm,
        }],
      ],
    },
  };

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
    }, [],
  );

  return ctx.reply(_.join(keys, ', '), extraMarkup);
};

export default searchExpls;
