import * as _ from 'lodash';
import * as messages from '../constants/messages';
import * as db from '../database';
import { Context } from '../types/telegraf';
import { sendExpl } from '../utils';

export const AMOUNT_OF_OPTIONS = 4;

export const startQuiz = async (ctx: Context) => {
  const wasReply = Boolean(ctx.message!.reply_to_message);

  const correctExpl = wasReply
    ? await db.getResolve(
        { user: ctx.from!.id, chat: ctx.chat!.id },
        ctx.message!.reply_to_message!.message_id,
      )
    : _.first(await db.getRandomExpls(ctx.from!.id));

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
      ctx.from!.id,
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

  const quiz = await (ctx as any).replyWithQuiz(
    'Which one is the correct key?',
    options,
    {
      correct_option_id: correctOptionId,
      reply_to_message_id: replyTo,
      is_anonymous: false,
    },
  );

  await db.knex('quizzes').insert({
    id: quiz.poll.id,
    creator_user_id: ctx.from!.id,
    correct_expl_id: correctExpl.id,
    correct_option_index: correctOptionId,
    chat_id: ctx.chat?.id,
  });
};
