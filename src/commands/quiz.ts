import * as _ from 'lodash';
import * as messages from '../constants/messages';
import * as db from '../database';
import type { Context } from '../types/telegraf';
import type { Table } from '../types/database';
import { sendExpl } from '../utils';

export const AMOUNT_OF_EXPL_OPTIONS = 3;
export const CHANCE_TO_OMIT_CORRECT_KEY = 33; // %

export async function startQuiz(ctx: Context) {
  const wasReply = Boolean(ctx.message!.reply_to_message);

  let correctExpl: Table.Expl | undefined;
  let replyTo: number;

  if (wasReply) {
    correctExpl = await db.getResolve(
      { user: ctx.from!.id, chat: ctx.chat!.id },
      ctx.message!.reply_to_message!.message_id,
    );
    replyTo = ctx.message!.reply_to_message!.message_id;
    if (!correctExpl) {
      return ctx.reply(messages.resolve.notExpl());
    }
  } else {
    correctExpl = _.first(await db.getRandomExpls(ctx.from!.id));
    if (!correctExpl) {
      return ctx.reply(messages.get.noExpls());
    }
    const msg = await sendExpl(ctx, correctExpl.key, correctExpl, true);
    replyTo = msg!.message_id;
  }

  let includeCorrectKey = _.random(0, 100) > CHANCE_TO_OMIT_CORRECT_KEY;

  const wrongExpls = _.map(
    await db.getRandomExpls(
      ctx.from!.id,
      AMOUNT_OF_EXPL_OPTIONS - (includeCorrectKey ? 1 : 0),
      correctExpl.key,
    ),
    (expl) => expl.key,
  );

  if (_.isEmpty(wrongExpls)) {
    return ctx.reply(messages.quiz.notEnoughOptions());
  }

  // Always include correct key if there're only few expls available
  if (!includeCorrectKey && wrongExpls.length < AMOUNT_OF_EXPL_OPTIONS) {
    includeCorrectKey = true;
  }

  let options: string[] = wrongExpls;
  if (includeCorrectKey) {
    options.push(correctExpl.key);
  }

  options = _.shuffle(options);
  options.push('None of the above');

  const correctOptionId = includeCorrectKey
    ? _.findIndex(options, (option) => option === correctExpl!.key)
    : options.length - 1;

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
}
