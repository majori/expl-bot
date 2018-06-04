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
    expl.telegram = {
      message: ctx.message!.reply_to_message!.message_id,
      chat: ctx.message!.chat.id,
    };

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
  const expls = await db.searchExpl(ctx.state.user, ctx.inlineQuery!.query);
  const results = _.map(expls, (expl) => ({
    type: 'article',
    id: expl.id,
    title: expl.key,
    input_message_content: {
      message_text: `/expl ${expl.key}`,
    },
  }));
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
