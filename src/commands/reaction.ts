
import * as _ from 'lodash';
import * as db from '../database';
import { Context } from '../types/telegraf';
import Logger from '../logger';
import * as messages from '../constants/messages';

const logger = new Logger(__filename);

export const reactionsKeyboard = async (reactions: string[], id: number) => {
  const amounts = await Promise.all(
    reactions.map(async reaction => await db.getReactionAmount(id, reaction)),
  );

  const buttons = reactions.map((reaction, i) => ({
    text: `${reaction} ${amounts[i]}`,
    callback_data: `reaction|${id}|${reaction}`,
  }));

  return { inline_keyboard: [ buttons ] };
};

const toggleReaction = async (ctx: Context) => {
  if (!ctx.callbackQuery || !ctx.callbackQuery.data) {
    return;
  }

  const [ type, id, reaction ] = ctx.callbackQuery.data.split('|');

  try {
    await db.addReaction(ctx.state, +id, reaction);
    ctx.answerCbQuery(messages.reaction.added(reaction));
  } catch (err) {
    switch (err.message) {
      case 'already_exists':
        await db.deleteReaction(ctx.state, +id, reaction);
        ctx.answerCbQuery(messages.reaction.removed(reaction));
        break;

      case 'expl_removed':
        await ctx.editMessageReplyMarkup();
        return ctx.answerCbQuery(messages.reaction.creatorHasRemoved());

      default:
        return;
    }
  }

  const oldKeyboard = _.get(ctx, 'callbackQuery.message.reply_markup.inline_keyboard[0]', []);
  const reactions = _.map(oldKeyboard, key => key.callback_data!.split('|')[2]);

  const keyboard = await reactionsKeyboard(reactions, +id);

  try {
    await ctx.editMessageReplyMarkup(keyboard);
  } catch (err) {
    logger.error(err);
  }
};

export default toggleReaction;
