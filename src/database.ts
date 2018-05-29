import * as Knex from 'knex';
import * as _ from 'lodash';
import config from './config';
import Logger from './logger';

const logger = new Logger(__filename);

export const knex = Knex(config.env.prod ? config.db.production : config.db.development);

type ExplOptions = { userId: number; chatId: number; username: string; key: string; message: string | number; };
export const createExpl = async (options: ExplOptions) => {
  const expl: Partial<Table.Expl> = {
    key: options.key,
    tg_user_id: options.userId,
    tg_chat_id: options.chatId,
    tg_username: options.username,
  };

  if (_.isString(options.message)) {
    expl.value = options.message;
  } else {
    expl.tg_message_id = options.message;
  }

  try {
    await knex('expls')
      .insert(expl);
  } catch (err) {
    if (err.constraint === 'expls_tg_user_id_key_unique') {
      return false;
    }
    throw err;
  }

  logger.debug('Created expl', { key: options.key });
  return true;
};

export const getExpl = async (user: number, key: string, offset?: number) => {
  const results: Table.Expl[] = await getExplsForUser(user)
    .andWhere({ 'expls.key': key });

  if (_.isEmpty(results)) {
    return null;
  }

  const selected = offset ?
    results[_.clamp(offset, 0, _.size(results))] :
    _.first(results)!;

  return updateExpl(selected);
};

export const getRandomExpl = async (user: number) => {
  const count: number = await getExplsForUser(user)
    .count();
  const results: Table.Expl[] = await getExplsForUser(user)
    .limit(1)
    .offset(_.random(count - 1));

  if (_.isEmpty(results)) {
    return null;
  }

  return updateExpl(_.first(results)!);
};

export const searchExpl = async (user: number, searchTerm: string): Promise<Array<Partial<Table.Expl>>> => {
  return getExplsForUser(user)
    .select(['expls.key', 'expls.id'])
    .andWhere('expls.key', 'like', `%${searchTerm}%`);
};

export const addUserToChat = async (user: number, chat: number) => {
  try {
    await knex('auth')
    .insert({
      tg_user_id: user,
      tg_chat_id: chat,
    });
    logger.debug('User added to chat', { user, chat });
    return true;
  } catch (err) {
    logger.error(err);
    logger.debug('User already in chat', { user, chat });
    return false;
  }
};

const getExplsForUser = (user: number) => knex
  .from('expls')
  .where(function() {
    this.whereIn('tg_user_id', function() {
      this.from('auth')
        .select('tg_user_id')
        .whereIn('tg_chat_id', function() {
          this.from('auth')
            .select('tg_chat_id')
            .where({ tg_user_id: user });
        });
    })
    .orWhere('tg_user_id', user);
  });

const updateExpl = async (expl: Table.Expl) => {
  await knex.raw(`
    UPDATE expls
    SET
      "echo_count" = "echo_count" + 1,
      "last_echo" = ?
    WHERE "id" = ?
  `, [new Date().toISOString(), expl.id]);

  logger.debug('Expl updated', { key: expl.key });
  return expl;
};
