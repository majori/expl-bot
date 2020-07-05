import * as Knex from 'knex';
import * as _ from 'lodash';
import * as config from './config';
import { Table, Options } from './types/database';
import Logger from './logger';

const logger = new Logger(__filename);

type KarmaStatColumn = 'likes' | 'dislikes' | 'echos';

const karmaTableMapping: { [key: string]: KarmaStatColumn } = {
  '👍': 'likes',
  '👎': 'dislikes',
};

export const knex = Knex(
  config.env.prod ? config.db.production : config.db.development,
);

const enum PostgresErrorCodes {
  uniqueViolation = '23505',
  foreignKeyViolation = '23503',
}

export async function createExpl(options: Options.Expl) {
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
        .insert(expl)
        .returning('id')
        .then(([id]) => {
          expl.id = id;
        });
    });
  } catch (err) {
    if (err.code === PostgresErrorCodes.uniqueViolation) {
      throw new Error('already_exists');
    }
    throw err;
  }

  logger.debug('Created expl', { key: expl.key });

  return expl;
}

export async function getExpl(user: number, key: string, offset?: number) {
  const results: Array<Table.Expl & Table.TgContents> = await getExplsForUser(
    user,
  )
    .andWhere({ 'expls.key': _.toLower(key) })
    .orderBy('created_at', 'asc')
    .groupBy('id', 'content_id');

  if (_.isEmpty(results)) {
    return null;
  }

  const selected =
    offset && offset > 0
      ? results[_.clamp(offset - 1, 0, _.size(results) - 1)]
      : _.sample(results)!;

  return createNestedExpl(selected);
}

export async function getRandomExpls(
  user: number,
  amount: number = 1,
  keyFilter?: string,
) {
  const results = getExplsForUser(user).orderByRaw('RANDOM()').limit(amount);

  if (keyFilter) {
    results.whereNot({ key: keyFilter });
  }

  return _.map<Table.Expl & Table.TgContents, Table.Expl>(
    await results,
    createNestedExpl,
  );
}

type SearchExpls = (
  user: number,
  searchTerm: string,
  limit?: number,
  uniq?: boolean,
) => Promise<Array<Partial<Table.Expl>>>;

export const searchExpls: SearchExpls = async (
  user,
  searchTerm,
  limit?,
  uniq?,
) => {
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

export async function searchRexpls(
  user: number,
): Promise<Array<Partial<Table.Expl>>> {
  return getExplsForUser(user)
    .whereNotNull('tg_contents.photo_id')
    .orWhereNotNull('tg_contents.sticker_id')
    .orWhereNotNull('tg_contents.video_id')
    .orderBy('created_at', 'desc');
}

export async function addUserToChat(user: number, chat: number) {
  try {
    await knex('auth').insert({
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
}

export async function deleteExpl(user: number, key: string) {
  const query = knex('expls').where({ user_id: user, key });

  const count: number = await query.del();

  if (count > 0) {
    logger.debug(`Expl ${key} deleted`, { user });
  }

  return count;
}

export async function deleteUser(user: number) {
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
}

function getExplsForUser(user: number) {
  const query = knex
    .from('expls')
    .leftJoin('tg_contents', 'expls.tg_content', 'tg_contents.content_id')
    .where(function () {
      this.whereIn('user_id', function () {
        this.from('auth')
          .select('user_id')
          .whereIn('chat_id', function () {
            this.from('auth').select('chat_id').where({ user_id: user });
          });
      }).orWhere('user_id', user);
    });

  return query;
}

export async function addEcho(
  expl: Table.Expl,
  from: { chat: number; user: number },
  wasRandom: boolean,
  sentMessageId: number,
) {
  await knex('echo_history').insert({
    expl_id: expl.id,
    user_id: from.user,
    chat_id: from.chat,
    was_random: wasRandom,
    echo_message_id: sentMessageId,
  });

  logger.debug('Expl echoed', { id: expl.id, key: expl.key });
  return expl;
}

function createNestedExpl(expl: Table.Expl & Table.TgContents): Table.Expl {
  // Telegram content columns
  const columns = [
    'content_id',
    'message_id',
    'chat_id',
    'sticker_id',
    'audio_id',
    'photo_id',
    'video_id',
  ];
  return {
    ...(_.omit(expl, columns) as any),
    tg_content: _.pick(expl, columns),
  };
}

export async function getResolve(
  from: { chat: number; user: number },
  echo: number,
) {
  const results: Array<Table.Expl & Table.TgContents> = await getExplsForUser(
    from.user,
  ).where(function () {
    this.whereIn('id', function () {
      this.from('echo_history')
        .select('expl_id')
        .where('echo_message_id', echo)
        .andWhere('chat_id', from.chat);
    });
  });

  if (_.isEmpty(results)) {
    return;
  }
  return createNestedExpl(_.first(results)!);
}

export async function getReactionAmount(id: number, reaction: string) {
  const query = knex('reactions').count().where({ expl_id: id, reaction });
  const count: number = +_.get(await query, [0, 'count'], 0);

  return count;
}

export async function addReaction(
  from: { chat: number; user: number },
  id: number,
  reaction: string,
) {
  try {
    await knex('reactions').insert({
      user_id: from.user,
      expl_id: id,
      chat_id: from.chat,
      reaction,
    });

    if (karmaTableMapping[reaction]) {
      const expl = await knex('expls').where({ id: id }).first();
      if (expl.user_id != from.user) {
        await addKarmaStat(expl.user_id, karmaTableMapping[reaction], 1);
      }
    }

    logger.debug('Reaction added', { id, reaction });
  } catch (err) {
    if (err.code === PostgresErrorCodes.uniqueViolation) {
      throw new Error('already_exists');
    } else if (err.code === PostgresErrorCodes.foreignKeyViolation) {
      throw new Error('expl_removed');
    } else {
      logger.error(err);
    }

    throw err;
  }
}

export async function deleteReaction(
  userId: number,
  explId: number,
  reaction: string,
) {
  try {
    await knex('reactions')
      .where({
        user_id: userId,
        expl_id: explId,
        reaction,
      })
      .del();

    logger.debug('Reaction deleted', { id: explId, reaction });

    if (karmaTableMapping[reaction]) {
      const expl = await knex('expls').where({ id: explId }).first();
      if (expl.user_id != userId) {
        await addKarmaStat(expl.user_id, karmaTableMapping[reaction], -1);
      }
    }

    return true;
  } catch (err) {
    logger.error(err);
    throw err;
  }
}

export async function addKarmaStat(
  user: number,
  column: 'likes' | 'dislikes' | 'echos',
  amount: number,
) {
  if (!(await knex('karma').where('user_id', user).first())) {
    await knex('karma').insert({ user_id: user, [column]: amount });
  } else {
    await knex('karma').where('user_id', user).increment(column, amount);
  }
}

export async function getUserKarma(user: number): Promise<number> {
  const karmaRow = await knex('karma').where({ user_id: user }).first();
  if (!karmaRow) {
    return 0;
  }

  // TODO: Calculate karma
  return 1;
}
