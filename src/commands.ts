
import * as _ from 'lodash';
import * as db from './database';
import { Context } from './types/telegraf';
import Logger from './logger';
import * as messages from './constants/messages';

const logger = new Logger(__filename);

export const getExpl = async (ctx: Context) => {
  const words = ctx.message!.text!.split(' ');

  if (words.length < 2 || _.isEmpty(words[1])) {
    return ctx.replyWithMarkdown(messages.get.invalidSyntax(_.first(words)));
  }
  const offset = _.chain(words).get([2], 0).toNumber().value() || 0;

  const expl = await db.getExpl(ctx.state.user, words[1], offset);
  await sendExpl(ctx, words[1], expl);
};

export const getRandomExpl = async (ctx: Context) => {
  const expl = await db.getRandomExpl(ctx.state.user);

  if (!expl) {
    return ctx.reply(messages.get.noExpls());
  }

  await sendExpl(ctx, expl.key, expl);
};

export const createExpl = async (ctx: Context) => {
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

  // Expl value is normal text
  if (words.length >= 3 && !ctx.message!.reply_to_message) {
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
    ctx.reply(messages.add.successful());
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

export const searchExpls = async (ctx: Context) => {
  const words = ctx.message!.text!.split(' ');
  if (words.length < 2 || _.isEmpty(words[1])) {
    return ctx.replyWithMarkdown(messages.list.invalidSyntax(_.first(words)));
  }

  const searchTerm = words[1];
  const result = await db.searchExpls(ctx.state.user, searchTerm);

  if (_.isEmpty(result)) {
    return ctx.reply(messages.list.notFound(searchTerm));
  }

  const uniqueKeys = _.groupBy(result, 'key');
  if (_.size(uniqueKeys) > 100) {
    return ctx.reply(messages.list.tooMany(searchTerm));
  }

  const keys = _.reduce(
    uniqueKeys,
    (memo: string[], rows, key) => {
      memo.push(key + (_.size(rows) > 1 ? ` [${_.size(rows)}]` : ''));
      return memo;
    }, [],
  );

  return ctx.reply(_.join(keys, ', '));
};

export const removeExpl = async (ctx: Context) => {
  const words = ctx.message!.text!.split(' ');

  if (words.length < 2 || _.isEmpty(words[1])) {
    return ctx.replyWithMarkdown(messages.remove.invalidSyntax(_.first(words)));
  }
  const key = words[1];
  const count = await db.deleteExpl(ctx.state.user, key);

  return (count > 0) ?
    ctx.reply(messages.remove.successful(key)) :
    ctx.reply(messages.errors.notFound(key));
};

export const handleInlineQuery = async (ctx: Context) => {
  const query = ctx.inlineQuery!.query;

  const expls = await (_.isEmpty(query) ?
    db.searchRexpls(ctx.state.user) :
    db.searchExpls(ctx.state.user, query, 15, true)
  );
  const results = _.map(expls, expl => getInlineResult(expl));

  return ctx.answerInlineQuery(results as any);
};

const sendExpl = async (ctx: Context, key: string, expl: Table.Expl | null) => {
  if (!expl) {
    return ctx.reply(messages.errors.notFound(key));
  }

  if (expl.value) {
    return ctx.reply(`${expl.key}: ${expl.value}`);
  }

  if (expl.tg_content) {
    const content = expl.tg_content;
    if (content.message_id && content.chat_id) {
      try {
        await ctx.telegram.forwardMessage(ctx.state.chat, +content.chat_id, content.message_id);
      } catch (err) {
        logger.error(err);
        if (err.code === 400 && err.description === 'Bad Request: chat not found') {
          return ctx.reply(messages.get.forbidden());
        }
      }
    }
  }
};

const getInlineResult = (expl: Partial<Table.Expl> & Partial<Table.TgContents>) => {
  const inlineOpt = {
    title: expl.key,
    id: expl.key,
    input_message_content: { message_text: `/expl ${expl.key}` },
  };

  if (expl.photo_id) {
    return {
      type: 'photo',
      photo_file_id: expl.photo_id,
      ...inlineOpt,
    };
  }

  if (expl.video_id) {
    return {
      type: 'video',
      video_file_id: expl.video_id,
      ...inlineOpt,
    };
  }

  if (expl.sticker_id) {
    return {
      type: 'sticker',
      sticker_file_id: expl.sticker_id,
      ...inlineOpt,
    };
  }

  return {
    type: 'article',
    ...inlineOpt,
  };
};
