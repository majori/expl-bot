import * as _ from 'lodash';
import * as db from '../database';
import { Context } from '../types/telegraf';
import * as messages from '../constants/messages';
import { sendExpl } from '../utils';

export const startQuiz = async (ctx: Context) => {
  const wasReply = Boolean(ctx.message!.reply_to_message);

  const correctExpl = wasReply
    ? await db.getResolve(ctx.state, ctx.message!.reply_to_message!.message_id)
    : await db.getRandomExpl(ctx.state.user);

  if (!correctExpl) {
    return ctx.reply(
      wasReply ? messages.resolve.notExpl() : messages.get.noExpls(),
    );
  }

  let replyTo: number;
  if (wasReply) {
    replyTo = ctx.message!.reply_to_message!.message_id;
  } else {
    const msg = await sendExpl(ctx, correctExpl.key, correctExpl, true);
    replyTo = msg!.message_id;
  }

  // TODO: Get N amount of random expls with unique key
  const options = _.shuffle([correctExpl.key, 'TODO_1', 'TODO_2', 'TODO_3']);
  const correctOptionId = _.findIndex(
    options,
    (option) => option === correctExpl.key,
  );

  await (ctx as any).replyWithQuiz('Which one is the right key?', options, {
    correct_option_id: correctOptionId,
    reply_to_message_id: replyTo,
  });
};
