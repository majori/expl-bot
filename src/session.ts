import { session as sessionMiddleware, Context } from 'telegraf';

import logger from './logger';
import { knex } from './database';

async function getSession(key: string): Promise<Object> {
  const [userId, chatId] = key.split(':');
  const existingSession = await knex('sessions')
    .select('session')
    .where({
      user_id: userId,
      chat_id: chatId,
    })
    .first();

  if (existingSession) {
    return existingSession.session;
  }

  await knex('sessions').insert({
    user_id: userId,
    chat_id: chatId,
  });

  logger.debug('User added to chat', { user: userId, chat: chatId });
  return {};
}

async function setSession(key: string, value: Object = {}): Promise<void> {
  const [userId, chatId] = key.split(':');
  await knex('sessions').update({ session: value }).where({
    user_id: userId,
    chat_id: chatId,
  });
}

async function deleteSession(key: string): Promise<void> {
  await setSession(key, {});
}

async function getSessionKey(ctx: Context): Promise<string | undefined> {
  if (ctx.from?.id && ctx.inlineQuery) {
    return `${ctx.from.id}:${ctx.from.id}`;
  } else if (ctx.callbackQuery && ctx.chat) {
    return `${ctx.callbackQuery.from.id}:${ctx.chat.id}`;
  } else if (ctx.from?.id && ctx.chat) {
    return `${ctx.from.id}:${ctx.chat.id}`;
  }
  return undefined;
}

export const session = sessionMiddleware({
  getSessionKey,
  store: { get: getSession, set: setSession, delete: deleteSession },
});
