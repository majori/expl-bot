
import * as _ from 'lodash';
import * as db from '../database';
import { Context } from '../types/telegraf';
import * as messages from '../constants/messages';

const searchExpls = async (ctx: Context) => {
  const words = ctx.message!.text!.split(' ');
  if (words.length < 2 || _.isEmpty(words[1])) {
    return ctx.replyWithMarkdown(messages.list.invalidSyntax(_.first(words)));
  }

  const searchTerm = words[1];
  const result = await db.searchExpls(ctx.state.user, searchTerm);

  if (_.isEmpty(result)) {
    return ctx.reply(messages.list.notFound(searchTerm));
  }

  const uniqueKeys = _.groupBy(result, 'key');
  if (_.size(uniqueKeys) > 100) {
    return ctx.reply(messages.list.tooMany(searchTerm));
  }

  const keys = _.reduce(
    uniqueKeys,
    (memo: string[], rows, key) => {
      memo.push(key + (_.size(rows) > 1 ? ` [${_.size(rows)}]` : ''));
      return memo;
    }, [],
  );

  return ctx.reply(_.join(keys, ', '));
};

export default searchExpls;
