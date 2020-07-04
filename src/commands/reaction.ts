import * as db from '../database';
import type { Context } from '../types/telegraf';
import Logger from '../logger';
import * as messages from '../constants/messages';

const logger = new Logger(__filename);

export const reactionsKeyboard = async (id: number) => {
  const reactions = ['👍', '👎'];

  const amounts = await Promise.all(
    reactions.map(async (reaction) => await db.getReactionAmount(id, reaction)),
  );

  const buttons = reactions.map((reaction, i) => ({
    text: `${reaction} ${amounts[i]}`,
    callback_data: `reaction|${id}|${reaction}`,
  }));

  return { inline_keyboard: [buttons] };
};

export const toggleReaction = async (ctx: Context) => {
  if (!ctx.callbackQuery || !ctx.callbackQuery.data) {
    return;
  }

  const [type, id, reaction] = ctx.callbackQuery.data.split('|');

  try {
    await db.addReaction(
      { user: ctx.from!.id, chat: ctx.chat!.id },
      +id,
      reaction,
    );
    ctx.answerCbQuery(messages.reaction.added(reaction));
  } catch (err) {
    switch (err.message) {
      case 'already_exists':
        await db.deleteReaction(ctx.from!.id, +id, reaction);
        ctx.answerCbQuery(messages.reaction.removed(reaction));
        break;

      case 'expl_removed':
        await ctx.editMessageReplyMarkup();
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
};
