import type { CallbackQuery } from 'typegram';

import * as db from '../../database';
import type { Context } from '../../types/telegraf';
import logger from '../../logger';
import * as messages from '../../constants/messages';

export async function reactionsKeyboard(id: number) {
  const reactions = ['👍', '👎'];

  const amounts = await Promise.all(
    reactions.map(async (reaction) => await db.getReactionAmount(id, reaction)),
  );

  const buttons = reactions.map((reaction, i) => ({
    text: `${reaction} ${amounts[i]}`,
    callback_data: `reaction|${id}|${reaction}`,
  }));

  return { inline_keyboard: [buttons] };
}

export async function toggleReaction(ctx: Context) {
  const cbQuery = ctx.callbackQuery as
    | CallbackQuery.DataCallbackQuery
    | undefined;
  if (!cbQuery?.data) {
    return;
  }

  const [type, id, reaction] = cbQuery.data.split('|');

  try {
    await db.addReaction(
      { user: ctx.from!.id, chat: ctx.chat!.id },
      +id,
      reaction,
    );
    await ctx.answerCbQuery(messages.reaction.added(reaction));
  } catch (err) {
    switch (err.message) {
      case 'already_exists':
        if (
          ctx.session.reactionToBeDeleted &&
          ctx.session.reactionToBeDeleted.id == +id &&
          Date.now() - ctx.session.reactionToBeDeleted.timestamp <= 4e3
        ) {
          delete ctx.session.reactionToBeDeleted;
          await db.deleteReaction(ctx.from!.id, +id, reaction);
          ctx.answerCbQuery(messages.reaction.removed(reaction));
          break;
        } else {
          ctx.session.reactionToBeDeleted = {
            id: +id,
            timestamp: Date.now(),
          };
          await ctx.answerCbQuery(messages.reaction.confirmRemoval());
          return;
        }

      case 'expl_removed':
        await ctx.editMessageReplyMarkup(undefined);
        await ctx.answerCbQuery(messages.reaction.creatorHasRemoved());
        return;

      default:
        throw err;
    }
  }

  const keyboard = await reactionsKeyboard(+id);

  try {
    await ctx.editMessageReplyMarkup(keyboard);
  } catch (err) {
    logger.error(err);
  }
}
