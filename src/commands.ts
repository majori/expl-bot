import * as _ from 'lodash';
import * as db from './database';
import { Context } from './types/telegraf';

export const getExpl = async (ctx: Context) => {
  const words = ctx.message!.text!.split(' ');

  if (words.length < 2 || _.isEmpty(words[1])) {
    return ctx.replyWithMarkdown(`Try \`${_.first(words)} key\``);
  }
  const offset = _.chain(words).get([2], 0).toNumber().value() || 0;

  const expl = await db.getExpl(ctx.state.user, words[1], offset);
  await sendExpl(ctx, expl);
};

export const getRandomExpl = async (ctx: Context) => {
  const expl = await db.getRandomExpl(ctx.state.user);

  if (!expl) {
    return ctx.reply('Can\'t find any expl for you :/');
  }

  await sendExpl(ctx, expl);
};

export const createExpl = async (ctx: Context) => {
  const words = ctx.message!.text!.split(' ');

  const errorMessage = `Try \`${_.first(words)} [key] [value]\` ` +
    `or reply to any message with \`${_.first(words)} [key]\``;

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

  const successful = await db.createExpl(expl);

  return ctx.reply(successful ? 'Expl created!' : `You have already an expl with the key "${key}".`);
};

export const joinGroup = async (ctx: Context) => {
  if (ctx.chat!.type === 'private') {
    return ctx.reply('Use this command from group chats!');
  }

  const joined = await db.addUserToChat(ctx.state.user, ctx.state.chat);
  const msg = `You ${ joined ? 'successfully joined' : 'are already in' } ` +
    `${ctx.chat!.title ? `group *${ctx.chat!.title}*` : 'the group'}!`;
  return ctx.replyWithMarkdown(msg);
};

export const searchExpl = async (ctx: Context) => {
  const query = ctx.inlineQuery!.query;
  let results: any;

  if (_.isEmpty(query)) {
    const rexpls = await db.searchRexpls(ctx.state.user, query);
    results = _.map(rexpls, expl => getInlineResult(expl));
  } else {
    const expls = await db.searchExpl(ctx.state.user, query);
    results = _.map(expls, expl => getInlineResult(expl));
  }

  return ctx.answerInlineQuery(results as any);
};

export const removeExpl = async (ctx: Context) => {
  const words = ctx.message!.text!.split(' ');

  if (words.length < 2 || _.isEmpty(words[1])) {
    return ctx.replyWithMarkdown(`Try \`${_.first(words)} [key]\``);
  }
  const key = words[1];
  const count = await db.deleteExpl(ctx.state.user, key);

  return (count > 0) ?
    ctx.reply(`Expl "${key}" removed.`) :
    ctx.reply(`Expl "${key}" not found.`);
};

const sendExpl = async (ctx: Context, expl: Table.Expl | null) => {
  if (!expl) {
    return ctx.reply('Expl not found.');
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
        if (err.code === 400 && err.description === 'Bad Request: chat not found') {
          return ctx.reply('Expl cannot be shown since the user or the chat has blocked the bot 😢');
        }
      }
    }
  }
};

const getInlineResult = (expl: Partial<Table.Expl> & Partial<Table.TgContents>) => {
  if (expl.photo_id) {
    return {
      type: 'photo',
      title: expl.key,
      id: expl.id,
      photo_file_id: expl.photo_id,
      input_message_content: {
        message_text: `/expl ${expl.key}`,
      },
    };
  }

  return {
    type: 'article',
    id: expl.id,
    title: expl.key,
    input_message_content: {
      message_text: `/expl ${expl.key}`,
    },
  };
};
