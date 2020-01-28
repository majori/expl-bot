import * as db from '../database';
import { Context } from '../types/telegraf';

export const handlePollAnswer = async (ctx: Context) => {
  const answer = (ctx.update as any).poll_answer;

  const quiz = await db
    .knex('quizzes')
    .where({ id: answer.poll_id })
    .first();

  if (!quiz) {
    return;
  }

  await db.knex('quiz_answers').insert({
    user_id: (ctx.update as any).poll_answer.user.id,
    quiz_id: quiz.id,
    was_correct: answer.option_ids[0] === quiz.correct_option_index,
  });
};
