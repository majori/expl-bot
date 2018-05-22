import * as db from './database';
import { Context } from './types/telegraf';

export const getExpl = async (ctx: Context) => {
  const expl = await db.getExpl(ctx.state.user, 'key');
  if (!expl) {
    return ctx.reply('Expl not found.');
  }

  return ctx.reply(JSON.stringify(expl, null, 2));
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
