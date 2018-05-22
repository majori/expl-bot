import * as Knex from 'knex';
import * as _ from 'lodash';
import config from './config';

export const knex = Knex(config.env.prod ? config.db.production : config.db.development);

export const createExpl = async (user: number, chat: number, key: string, message: string | number) => {
  const expl: Partial<Table.Expl> = {
    key,
    tg_user_id: user,
    tg_chat_id: chat,
  };

  if (_.isString(message)) {
    expl.value = message;
  } else {
    expl.tg_message_id = message;
  }

  await knex('expls')
    .insert(expl);
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

  return updateExpl(_.first(results)!);
};

export const searchExpl = async (user: number, searchTerm: string) => {
  return getExplsForUser(user)
    .select('key')
    .andWhere('key', 'like', `%${searchTerm}%`); // TODO: Test if we have to escape this
};

export const addUserToChat = async (user: number, chat: number) => {
  return knex('auth')
    .insert({
      tg_user_id: user,
      tg_chat_id: chat,
    });
};

const getExplsForUser = (user: number) => knex
  .from('expls')
  .join('auth', {'auth.tg_user_id': 'expls.tg_user_id' })
  .whereIn('auth.tg_chat_id', function() {
    this.select('tg_chat_id')
      .from('auth')
      .where({ tg_user_id: user });
  });

const updateExpl = async (expl: Table.Expl) => {
  await knex('expls')
    .where({ id: expl.id })
    .increment('echo_count', 1)
    .update('last_echo', new Date().toISOString());

  return expl;
};
