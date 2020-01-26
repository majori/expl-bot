import * as _ from 'lodash';
import * as db from '../database';
import { Context } from '../types/telegraf';
import * as messages from '../constants/messages';
import { sendExpl } from '../utils';

const AMOUNT_OF_OPTIONS = 4;

export const startQuiz = async (ctx: Context) => {
  const wasReply = Boolean(ctx.message!.reply_to_message);

  const correctExpl = wasReply
    ? await db.getResolve(ctx.state, ctx.message!.reply_to_message!.message_id)
    : _.first(await db.getRandomExpls(ctx.state.user));

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

  const wrongExpls = _.map(
    await db.getRandomExpls(
      ctx.state.user,
      AMOUNT_OF_OPTIONS - 1,
      correctExpl.key,
    ),
    (expl) => expl.key,
  );

  if (wrongExpls.length < 2) {
    return ctx.reply(messages.quiz.notEnoughOptions());
  }

  const options = _.shuffle([correctExpl.key, ...wrongExpls]);
  const correctOptionId = _.findIndex(
    options,
    (option) => option === correctExpl.key,
  );

  await (ctx as any).replyWithQuiz('Which one is the correct key?', options, {
    correct_option_id: correctOptionId,
    reply_to_message_id: replyTo,
    is_anonymous: false,
  });
};
