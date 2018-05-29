import * as db from './database';
import { Context } from './types/telegraf';

export const getExpl = async (ctx: Context) => {
  const words = ctx.message!.text!.split(' ');

  if (words.length < 2 || words[1].length < 1) {
    return null;
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
  return ctx.reply(JSON.stringify(expl, null, 2));
};

export const createExpl = async (ctx: Context) => {
  await db.createExpl(ctx.state.user, ctx.state.chat, 'key', 'MESSAGE');
  return ctx.reply('Expl created!');
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
  const results = expls.map((expl: Partial<Table.Expl>) => ({
    type: 'article',
    id: expl.id,
    title: expl.key,
    input_message_content: {
      message_text: `/expl ${expl.key}`,
    },
  }));
  return ctx.answerInlineQuery(results);
};
