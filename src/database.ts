import * as Knex from 'knex';
import * as _ from 'lodash';
import config from './config';
import Logger from './logger';

const logger = new Logger(__filename);

export const knex = Knex(config.env.prod ? config.db.production : config.db.development);

export const createExpl = async (options: ExplOptions) => {
  const expl: Partial<Table.Expl> = {
    user_id: options.userId,
    key: options.key,
  };

  if (options.message) {
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
    if (err.constraint === 'expls_user_id_key_unique') {
      return false;
    }
    throw err;
  }

  logger.debug('Created expl', { key: options.key });
  return true;
};

export const getExpl = async (user: number, key: string, offset?: number) => {
  const results: Array<Table.Expl & Table.TgContents> = await getExplsForUser(user)
    .andWhere({ 'expls.key': key })
    .andWhere('expls.created_at', '>', '2018-06-04') // HACK: We can't show all expls because of BorisBot migration
    .orderBy('created_at', 'asc')
    .groupBy('id', 'content_id');

  if (_.isEmpty(results)) {
    return null;
  }

  const selected = offset && offset > 0 ?
    results[_.clamp(offset - 1, 0, _.size(results) - 1)] :
    _.last(results)!;

  const nested = createNestedExpl(selected);
  return updateExpl(nested);
};

export const getRandomExpl = async (user: number) => {
  const count: number = +_.get(await getExplsForUser(user).count(), [0, 'count'], 0);
  const results: Array<Table.Expl & Table.TgContents> = await getExplsForUser(user)
    .limit(1)
    .offset(_.random(count - 1));

  if (_.isEmpty(results)) {
    return null;
  }
  const nested = createNestedExpl(_.first(results)!);
  return updateExpl(nested);
};

export const searchExpl = async (user: number, searchTerm: string): Promise<Array<Partial<Table.Expl>>> => {
  return getExplsForUser(user)
    .select(['expls.key', 'expls.id'])
    .andWhere('expls.key', 'like', `%${searchTerm}%`)
    .limit(15); // TODO: Use pagination
};

export const searchRexpls = async (user: number, searchTerm: string): Promise<Array<Partial<Table.Expl>>> => {
  return getExplsForUser(user)
    .whereNotNull('tg_contents.photo_id');
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
  const count: number = await knex('expls')
    .where({ user_id: user, key })
    .del();

  logger.debug(`Expl ${key} deleted`, { user });
  return count;
};

const getExplsForUser = (user: number) => knex
  .from('expls')
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

const updateExpl = async (expl: Table.Expl) => {
  await knex.raw(`
    UPDATE expls
    SET
      "echo_count" = "echo_count" + 1,
      "last_echo" = ?
    WHERE "id" = ?
  `, [new Date().toISOString(), expl.id]);

  logger.debug('Expl updated', { id: expl.id, key: expl.key });
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
