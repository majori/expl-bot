import * as _ from 'lodash';
import type { Message } from 'typegram';

import * as db from '../../database';
import logger from '../../logger';
import * as messages from '../../constants/messages';
import { reactionsKeyboard } from '../events/reaction';
import type { Context } from '../../types/telegraf';
import type { Options } from '../../types/database';

export async function createExpl(ctx: Context) {
  const message = ctx.message as Message.TextMessage;
  const words = message.text.split(' ');

  const errorMessage = messages.add.invalidSyntax(_.first(words));

  if (words.length < 2 || _.isEmpty(words[1])) {
    return ctx.replyWithMarkdown(errorMessage);
  }

  const key = words[1];
  const expl: Options.Expl = {
    userId: ctx.from!.id,
    key,
  };

  const isExplWithValue = words.length > 2 && !message.reply_to_message;

  // Expl value is normal text
  if (isExplWithValue) {
    expl.message = _(words).drop(2).join(' ');

    // Expl value is reply to other message
  } else if (message.reply_to_message) {
    const replyTo: any = message.reply_to_message!;
    expl.telegram = {
      message: replyTo.message_id,
      chat: message.chat.id,
    };

    if (replyTo.from && replyTo.from.is_bot) {
      if (ctx.me !== replyTo.from.username) {
        return ctx.reply(messages.add.isBot());
      }
    }

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
    const { id } = await db.createExpl(expl);

    if (!id) {
      return;
    }

    const message =
      isExplWithValue || words.length <= 2
        ? messages.add.successful(key)
        : messages.add.successfulWithDisclaimer(key);

    const keyboard = await reactionsKeyboard(id);

    return ctx.reply(message, { reply_markup: keyboard });
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
}
