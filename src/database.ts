import * as Knex from 'knex';
import * as _ from 'lodash';
import config from './config';
import Logger from './logger';

const logger = new Logger(__filename);

export const knex = Knex(config.env.prod ? config.db.production : config.db.development);

export const createExpl = async (options: ExplOptions) => {
  const expl: Partial<Table.Expl> = {
    user_id: options.userId,
    key: _.toLower(options.key),
  };

  if (options.message) {
    if (_.size(options.message) > 500) {
      throw new Error('value_too_long');
    }
    expl.value = options.message;
  }

  let tgContent: Partial<Table.TgContents>;
  if (!_.isEmpty(options.telegram)) {
    tgContent = _.mapKeys(options.telegram, (value, key) => `${key}_id`);
  }

  try {
    await knex.transaction(async (trx) => {
      if (tgContent) {
        const ids = await knex('tg_contents')
          .transacting(trx)
          .insert(tgContent)
          .returning('content_id');
        expl.tg_content = _.first(ids);
      }

      await knex('expls')
        .transacting(trx)
        .insert(expl);
    });
  } catch (err) {
    // UNIQUE VIOLATION
    if (err.code === '23505') {
      throw new Error('already_exists');
    }
    throw err;
  }

  logger.debug('Created expl', { key: options.key });
};

export const getExpl = async (user: number, key: string, offset?: number) => {
  const results: Array<Table.Expl & Table.TgContents> = await getExplsForUser(user)
    .andWhere({ 'expls.key': _.toLower(key) })
    .orderBy('created_at', 'asc')
    .groupBy('id', 'content_id');

  if (_.isEmpty(results)) {
    return null;
  }

  const selected = offset && offset > 0 ?
    results[_.clamp(offset - 1, 0, _.size(results) - 1)] :
    _.sample(results)!;

  return createNestedExpl(selected);
};

export const getRandomExpl = async (user: number) => {
  const count: number = +_.get(await getExplsForUser(user).count(), [0, 'count'], 0);
  const results: Array<Table.Expl & Table.TgContents> = await getExplsForUser(user)
    .limit(1)
    .offset(_.random(count - 1));

  if (_.isEmpty(results)) {
    return null;
  }
  return createNestedExpl(_.first(results)!);
};

type SearchExpls = (
  user: number,
  searchTerm: string,
  limit?: number,
  uniq?: boolean,
) => Promise<Array<Partial<Table.Expl>>>;

export const searchExpls: SearchExpls = async (user, searchTerm, limit?, uniq?) => {
  const query = getExplsForUser(user)
    .select('expls.key')
    .andWhere('expls.key', 'like', `%${_.toLower(searchTerm)}%`);

  if (uniq) {
    query.groupBy('expls.key');
  }

  if (limit) {
    query.limit(limit);
  }

  return query;
};

export const searchRexpls = async (user: number): Promise<Array<Partial<Table.Expl>>> => {
  return getExplsForUser(user)
    .whereNotNull('tg_contents.photo_id')
    .orWhereNotNull('tg_contents.sticker_id')
    .orWhereNotNull('tg_contents.video_id')
    .orderBy('created_at', 'desc');
};

export const addUserToChat = async (user: number, chat: number) => {
  try {
    await knex('auth')
    .insert({
      user_id: user,
      chat_id: chat,
    });
    logger.debug('User added to chat', { user, chat });
    return true;
  } catch (err) {
    if (err.constraint === 'auth_user_id_chat_id_unique') {
      logger.debug('User already in chat', { user, chat });
      return false;
    }
    logger.error(err);
    throw err;
  }
};

export const deleteExpl = async (user: number, key: string) => {
  const query = knex('expls')
    .where({ user_id: user, key });

  // HACK: We can't show all expls because of BorisBot migration
  if (!config.isBorisBot) {
    query.andWhere('expls.created_at', '>', '2018-06-04');
  }

  const count: number = await query.del();

  logger.debug(`Expl ${key} deleted`, { user });
  return count;
};

export const deleteUser = async (user: number) => {
  return knex.transaction(async (trx) => {
    try {
      const explCount = await knex('expls')
        .transacting(trx)
        .where('user_id', user)
        .del();

      const chatCount = await knex('auth')
        .transacting(trx)
        .where('user_id', user)
        .del();

      logger.debug(`User ${user} deleted`, { explCount, chatCount });

      await trx.commit({
        expls: explCount,
        chats: chatCount,
      });
    } catch (err) {
      logger.error('Deleting user failed', err);
      await trx.rollback(err);
    }
  });
};

const getExplsForUser = (user: number) => {
  const query = knex.from('expls')
  .leftJoin('tg_contents', 'expls.tg_content', 'tg_contents.content_id')
  .where(function() {
    this.whereIn('user_id', function() {
      this.from('auth')
        .select('user_id')
        .whereIn('chat_id', function() {
          this.from('auth')
            .select('chat_id')
            .where({ user_id: user });
        });
    })
    .orWhere('user_id', user);
  });

  if (!config.isBorisBot) {
    // HACK: We can't show all expls because of BorisBot migration
    query.andWhere('expls.created_at', '>', '2018-06-04');
  }

  return query;
};

export const addEcho = async (expl: Table.Expl, from: { chat: number; user: number }) => {
  await knex('echo_history')
    .insert({
      expl_id: expl.id,
      user_id: from.user,
      chat_id: from.chat,
    });

  logger.debug('Expl echoed', { id: expl.id, key: expl.key });
  return expl;
};

const createNestedExpl = (expl: Table.Expl & Table.TgContents): Table.Expl => {
  // Telegram content columns
  const columns = ['content_id', 'message_id', 'chat_id', 'sticker_id', 'audio_id', 'photo_id', 'video_id'];
  return {
    ..._.omit(expl, columns) as any,
    tg_content: _.pick(expl, columns),
  };
};
