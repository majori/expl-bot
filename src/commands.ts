import * as _ from 'lodash';
import * as db from './database';
import { Context } from './types/telegraf';

export const getExpl = async (ctx: Context) => {
  const words = ctx.message!.text!.split(' ');

  if (words.length < 2 || _.isEmpty(words[1])) {
    return ctx.replyWithMarkdown(`Try \`${_.first(words)} key\``);
  }

  const expl = await db.getExpl(ctx.state.user, words[1]);

  if (!expl) {
    return ctx.reply('Expl not found.');
  }

  return expl.value ?
    ctx.reply(`${expl.key}: ${expl.value}`) :
    ctx.telegram.forwardMessage(ctx.state.chat, expl.tg_chat_id, expl.tg_message_id!);

};

export const getRandomExpl = async (ctx: Context) => {
  const expl = await db.getRandomExpl(ctx.state.user);

  if (!expl) {
    return ctx.reply('Can\'t find any expl for you :/');
  }

  return expl.value ?
    ctx.reply(`${expl.key}: ${expl.value}`) :
    ctx.telegram.forwardMessage(ctx.state.chat, expl.tg_chat_id, expl.tg_message_id!);
};

export const createExpl = async (ctx: Context) => {
  const words = ctx.message!.text!.split(' ');

  const errorMessage = `Try \`${_.first(words)} [key] [value]\` ` +
    `or reply to any message with \`${_.first(words)} [key]\``;

  if (words.length < 2 || _.isEmpty(words[1])) {
    return ctx.replyWithMarkdown(errorMessage);
  }

  const key = words[1];
  let value: number | string;

  // Expl value is normal text
  if (words.length >= 3 && !ctx.message!.reply_to_message) {
    value = _(words).drop(2).join(' ');

  // Expl value is reply to other message
  } else if (ctx.message!.reply_to_message) {
    value = ctx.message!.reply_to_message!.message_id;

  // Unknown format, send error message
  } else {
    return ctx.replyWithMarkdown(errorMessage);
  }

  const successful = await db.createExpl({
    userId: ctx.state.user,
    chatId: ctx.state.chat,
    username: ctx.from!.username || ctx.from!.first_name,
    key,
    message: value,
  });

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
