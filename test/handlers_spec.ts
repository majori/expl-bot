import { expect } from 'chai';
import * as _ from 'lodash';
import { handleInlineQuery } from '../src/handlers/inline-query';
import { RESULT_LIMIT } from '../src/handlers/inline-query';
import { inlineQuery, USER_ID } from './utils/context';
import { knex, clearDb, migrateAllDown } from './helper';

describe('Inline query', () => {
  beforeEach(clearDb);
  after(migrateAllDown);

  it('suggests rexpls if query is empty', async () => {
    const EXPL_COUNT = 10;
    const contentIds = await knex('tg_contents')
      .returning('content_id')
      .insert(
        _.times(EXPL_COUNT, (i) => ({
          photo_id: i * 100,
          chat_id: i * 100 + 1,
        })),
      );

    await knex('expls').insert(
      _.times(EXPL_COUNT, (i) => ({
        user_id: USER_ID,
        key: `key_${i}`,
        tg_content: contentIds[i],
      })),
    );

    const ctx = inlineQuery('');
    await handleInlineQuery(ctx);
    expect(ctx.answerInlineQuery.args[0][0]).to.have.length(EXPL_COUNT);
  });

  it('searches expls if query contains text', async () => {
    const EXPL_COUNT = _.clamp(5, RESULT_LIMIT);

    // Add keys which match search term
    await knex('expls').insert(
      _.times(EXPL_COUNT, (i) => ({
        user_id: USER_ID,
        key: `wanted_key_${i}`,
        value: 'value',
      })),
    );

    // Add expls which don't match search term
    await knex('expls').insert(
      _.times(EXPL_COUNT, (i) => ({
        user_id: USER_ID,
        key: `not_so_interesting_key_${i}`,
        value: 'value',
      })),
    );

    let ctx = inlineQuery('wanted');
    await handleInlineQuery(ctx);
    expect(ctx.answerInlineQuery.args[0][0]).to.have.length(EXPL_COUNT);

    ctx = inlineQuery('key');
    await handleInlineQuery(ctx);
    expect(ctx.answerInlineQuery.args[0][0]).to.have.length(
      _.clamp(EXPL_COUNT * 2, RESULT_LIMIT),
    );

    ctx = inlineQuery('404');
    await handleInlineQuery(ctx);
    expect(ctx.answerInlineQuery.args[0][0]).to.have.length(0);
  });
});
