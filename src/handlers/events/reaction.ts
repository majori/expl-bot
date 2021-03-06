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
  if (!cbQuery || !cbQuery.data) {
    return;
  }

  const [type, id, reaction] = cbQuery.data.split('|');

  try {
    await db.addReaction(
      { user: ctx.callbackQuery!.from.id, chat: ctx.chat!.id },
      +id,
      reaction,
    );
    await ctx.answerCbQuery(messages.reaction.added(reaction));
  } catch (err) {
    switch (err.message) {
      case 'already_exists':
        if (ctx.session?.reactionToBeDeleted !== +id) {
          ctx.session ??= {};
          ctx.session.reactionToBeDeleted = +id;
          setTimeout(() => (ctx.session!.reactionToBeDeleted = null), 4000);
          return ctx.answerCbQuery(messages.reaction.confirmRemoval());
        }

        await db.deleteReaction(ctx.callbackQuery!.from.id, +id, reaction);
        ctx.answerCbQuery(messages.reaction.removed(reaction));
        break;

      case 'expl_removed':
        await ctx.editMessageReplyMarkup(undefined);
        return ctx.answerCbQuery(messages.reaction.creatorHasRemoved());

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
