
import * as _ from 'lodash';
import * as db from '../database';
import { Context } from '../types/telegraf';
import Logger from '../logger';
import * as messages from '../constants/messages';

const logger = new Logger(__filename);

const createExpl = async (ctx: Context) => {
  const words = ctx.message!.text!.split(' ');

  const errorMessage = messages.add.invalidSyntax(_.first(words));

  if (words.length < 2 || _.isEmpty(words[1])) {
    return ctx.replyWithMarkdown(errorMessage);
  }

  const key = words[1];
  const expl: ExplOptions = {
    userId: ctx.state.user,
    key,
  };

  const isExplWithValue = words.length > 2 && !ctx.message!.reply_to_message;

  // Expl value is normal text
  if (isExplWithValue) {
    expl.message = _(words).drop(2).join(' ');

  // Expl value is reply to other message
  } else if (ctx.message!.reply_to_message) {
    const replyTo: any = ctx.message!.reply_to_message!;
    expl.telegram = {
      message: replyTo.message_id,
      chat: ctx.message!.chat.id,
    };

    if (replyTo.photo) {
      expl.telegram.photo = replyTo.photo[0].file_id;
    } else if (replyTo.audio) {
      expl.telegram.audio = replyTo.audio.file_id;
    } else if (replyTo.sticker) {
      expl.telegram.sticker = replyTo.sticker.file_id;
    }

  // Unknown format, send error message
  } else {
    return ctx.replyWithMarkdown(errorMessage);
  }
  try {
    await db.createExpl(expl);

    return (isExplWithValue || words.length <= 2) ?
      ctx.reply(messages.add.successful()) :
      ctx.reply(messages.add.successfulWithDisclaimer(key));

  } catch (err) {
    let msg = messages.errors.unknownError();
    switch (err.message) {
      case 'already_exists':
        msg = messages.add.duplicate(key);
        break;
      case 'value_too_long':
        msg = messages.add.tooLong(500);
        break;
      default:
        logger.error(err);
    }

    ctx.reply(msg);
  }
};

export default createExpl;