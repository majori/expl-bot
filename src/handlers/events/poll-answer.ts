import type { Update } from 'typegram';

import * as db from '../../database';
import { Context } from '../../types/telegraf';

export async function handlePollAnswer(ctx: Context) {
  const update = ctx.update as Update.PollAnswerUpdate;
  const answer = update.poll_answer;

  const quiz = await db.knex('quizzes').where({ id: answer.poll_id }).first();

  if (!quiz) {
    return;
  }

  await db.knex('quiz_answers').insert({
    user_id: answer.user.id,
    quiz_id: quiz.id,
    was_correct: answer.option_ids[0] === quiz.correct_option_index,
  });
}
