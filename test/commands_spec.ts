import { expect } from 'chai';
import * as _ from 'lodash';
import * as db from '../src/database';
import commands from '../src/handlers/commands';
import events from '../src/handlers/events';
import { MAX_COUNT as MAX_LIST_COUNT } from '../src/handlers/commands/list';
import { AMOUNT_OF_EXPL_OPTIONS } from '../src/handlers/commands/quiz';
import * as messages from '../src/constants/messages';
import { message, callbackQuery, USER_ID, GROUP_ID } from './utils/context';
import { knex, clearDb, migrateAllDown } from './helper';
import { Table } from '../src/types/database';
import { escapeMarkdownV2 } from '../src/utils';

describe('Commands', () => {
  beforeEach(clearDb);
  after(migrateAllDown);

  describe('/expl', () => {
    it('respond with error if expl not found', async () => {
      const KEY = 'NOT_FOUND';
      const ctx = message(`/expl ${KEY}`);
      await commands.expl(ctx);
      expect(ctx.reply.lastArg).to.equal(messages.errors.notFound(KEY));
    });

    it('gets expl with value', async () => {
      const expl = {
        key: 'key',
        value: 'value',
      };

      await knex('expls').insert({
        ...expl,
        user_id: USER_ID,
      });

      const ctx = message(`/expl ${expl.key}`);
      await commands.expl(ctx);
      expect(ctx.reply.lastArg).to.equal(expl.value);
    });

    describe('Telegram content', () => {
      it('gets expl with message', async () => {
        const KEY = 'key';
        const content = {
          message_id: 1234,
          chat_id: -1,
        };

        const contentIds = await knex('tg_contents')
          .insert(content)
          .returning('content_id');

        await knex('expls').insert({
          key: KEY,
          tg_content: _.first(contentIds),
          user_id: USER_ID,
        });

        const ctx = message(`/expl ${KEY}`);
        await commands.expl(ctx);
        expect(ctx.telegram.forwardMessage.args[0]).to.deep.equal([
          USER_ID,
          content.chat_id,
          content.message_id,
        ]);
      });

      it('gets expl with photo');
      it('gets expl with sticker');
      it('gets expl with audio');
      it('gets expl with video');
    });

    it('correctly gets indexed expl', async () => {
      const KEY = 'key';
      const users = [USER_ID, 223456789, 323456789, 423456789];

      // Make user to be in the same group
      await knex('auth').insert(
        _.map(users, (user) => ({
          user_id: user,
          chat_id: -123456789,
        })),
      );

      const expls = _.times(4, (num) => ({
        key: KEY,
        value: num.toString(),
        user_id: users[num],
      }));

      // Insert each expl individually so they have different created_at timestamps
      for (const expl of expls) {
        await knex('expls').insert(expl);
      }

      for (const index of _.times(4)) {
        const ctx = message(`/expl ${KEY} ${index + 1}`);
        await commands.expl(ctx);

        expect(ctx.reply.lastArg).to.equal(index.toString());
      }
    });

    it('updates echo history after sending a expl', async () => {
      const KEY = 'key';

      await knex('expls').insert({
        key: KEY,
        value: 'value',
        user_id: USER_ID,
      });

      await commands.expl(message(`/expl ${KEY}`));
      const history1 = await knex('echo_history')
        .join('expls', 'expls.id', 'echo_history.expl_id')
        .where('key', KEY);
      expect(history1).to.have.length(1);
      expect(history1[0].echoed_at).to.be.not.null;
      expect(history1[0].was_random).to.be.false;

      await commands.expl(message(`/expl ${KEY}`));
      const history2 = await knex('echo_history')
        .join('expls', 'expls.id', 'echo_history.expl_id')
        .where('key', KEY);
      expect(history2).to.have.length(2);
      expect(history2[1].echoed_at).to.be.not.null;
      expect(history2[1].was_random).to.be.false;

      await commands.rexpl(message('/rexpl'));
      const history3 = await knex('echo_history')
        .join('expls', 'expls.id', 'echo_history.expl_id')
        .where('key', KEY);
      expect(history3).to.have.length(3);
      expect(history3[2].echoed_at).to.be.not.null;
      expect(history3[2].was_random).to.be.true;
    });
  });

  describe('/rexpl', () => {
    it('gets a random expl', async () => {
      const VALUE = 'key';
      await knex('expls').insert(
        _.times(20, (i) => ({
          key: `key_${i}`,
          value: VALUE,
          user_id: USER_ID,
        })),
      );

      const ctx = message('/rexpl');
      await commands.rexpl(ctx);
      expect(ctx.reply.lastArg).equals(VALUE);
    });
  });

  describe('/resolve', () => {
    it('gets a key of a random expl', async () => {
      const KEY = 'key';
      await knex('expls').insert({
        key: KEY,
        value: 'value',
        user_id: USER_ID,
      });

      const ctx = message('/rexpl', true);
      await commands.rexpl(ctx);

      const ctx2 = message(
        '/resolve',
        true,
        ctx.reply.returnValues[0].message_id,
      );
      await commands.resolve(ctx2);

      expect(ctx2.replyWithMarkdown.args[0][0]).to.contain(KEY);
    });

    it('reacts to a key of a random expl', async () => {
      const KEY = 'key';
      await knex('expls').insert({
        key: KEY,
        value: 'value',
        user_id: USER_ID,
      });

      const ctx = message('/rexpl', true);
      await commands.rexpl(ctx);

      const ctx2 = message(
        '/resolve',
        true,
        ctx.reply.returnValues[0].message_id,
      );
      await commands.resolve(ctx2);

      const keyboard = _.get(
        ctx2,
        'replyWithMarkdown.args[0][1].reply_markup.inline_keyboard',
      );

      expect(keyboard[0][0].text).to.contain('0');

      const ctx3 = callbackQuery(keyboard[0][0].callback_data);
      await events.reaction(ctx3);
      await events.reaction(ctx3);
      await events.reaction(ctx3);

      const ctx4 = callbackQuery(keyboard[0][1].callback_data);
      await events.reaction(ctx4);

      const ctx5 = message(
        '/resolve',
        true,
        ctx.reply.returnValues[0].message_id,
      );
      await commands.resolve(ctx5);

      const keyboard2 = _.get(
        ctx5,
        'replyWithMarkdown.args[0][1].reply_markup.inline_keyboard',
      );

      expect(keyboard2[0][0].text).to.contain('0'); // because we 'pressed' to first button three times
      expect(keyboard2[0][1].text).to.contain('1'); // ... and the second only once
    });
  });

  describe('/add', () => {
    it('creates expl', async () => {
      const expl = {
        key: 'key',
        value: 'value',
      };
      const ctx = message(`/add ${expl.key} ${expl.value}`);
      await commands.add(ctx);

      const expls = await knex('expls');

      expect(expls).to.have.length(1);
      expect(ctx.reply.args[0][0]).to.equal(messages.add.successful(expl.key));
      expect(_.first(expls)).to.have.property('key', expl.key);
      expect(_.first(expls)).to.have.property('value', expl.value);
    });

    it('creates expl with Telegram content');

    it('prevents user to create multiple expls with same key', async () => {
      const expl = {
        key: 'key',
        value: 'value',
      };

      const ctx = message(`/add ${expl.key} ${expl.value}`);
      await commands.add(ctx);
      await commands.add(ctx);

      expect(await knex('expls')).to.have.length(1);
      expect(ctx.reply.lastArg).to.equal(messages.add.duplicate(expl.key));
    });
  });

  describe('/remove', () => {
    it('removes expl', async () => {
      const expl = {
        key: 'key',
        value: 'value',
      };

      await knex('expls').insert({
        ...expl,
        user_id: USER_ID,
      });

      const ctx = message(`/remove ${expl.key}`);
      await commands.remove(ctx);

      expect(await knex('expls')).to.be.empty;
    });

    it('responds with error if key does not exist', async () => {
      const KEY = 'key';
      const ctx = message(`/remove ${KEY}`);
      await commands.remove(ctx);

      expect(ctx.reply.lastArg).to.equal(messages.errors.notFound(KEY));
    });

    it('removes only own expls', async () => {
      const expl = {
        key: 'key',
        value: 'value',
      };

      await knex('expls').insert({
        ...expl,
        user_id: USER_ID,
      });

      // Other user's expl
      await knex('expls').insert({
        ...expl,
        user_id: 987654321,
      });

      const ctx = message(`/remove ${expl.key}`);

      await commands.remove(ctx);
      expect(await knex('expls')).to.have.length(1);

      await commands.remove(ctx);
      expect(await knex('expls')).to.have.length(1);
      expect(ctx.reply.lastArg).to.equal(messages.errors.notFound(expl.key));
    });
  });

  describe('/list', () => {
    it('searches keys with given search term', async () => {
      const COUNT = 3;

      await knex('expls').insert(
        _.times(COUNT, (i) => ({
          key: `like_key_${i}`,
          value: 'value',
          user_id: USER_ID,
        })),
      );

      const ctx1 = message(`/list key`);
      await commands.list(ctx1);
      expect(_.split(ctx1.reply.args[0][0], ', ')).to.have.length(COUNT);

      const ctx2 = message(`/list like`);
      await commands.list(ctx2);
      expect(_.split(ctx2.reply.args[0][0], ', ')).to.have.length(COUNT);

      const ctx3 = message(`/list 1`);
      await commands.list(ctx3);
      expect(_.split(ctx3.reply.args[0][0], ', ')).to.have.length(1);
    });

    it('shows amount of duplicate keys found', async () => {
      const COUNT = 3;

      await knex('expls').insert(
        _.times(COUNT, (i) => ({
          key: `same_key`,
          value: 'value',
          user_id: i,
        })),
      );

      await knex('auth').insert(
        _.flatten([
          _.times(COUNT, (i) => ({
            user_id: i,
            chat_id: -1,
          })),
          {
            user_id: USER_ID,
            chat_id: -1,
          },
        ]),
      );

      const ctx = message(`/list key`);
      await commands.list(ctx);
      expect(ctx.reply.args[0][0]).to.contain(`[${COUNT}]`);
    });

    it('responds with error if no keys found', async () => {
      const KEY = 'key';

      const ctx = message(`/list ${KEY}`);
      await commands.list(ctx);
      expect(ctx.reply.args[0][0]).to.equal(messages.list.notFound(KEY));
    });

    it(`responds with error if search results contains over ${MAX_LIST_COUNT} keys`, async () => {
      const COUNT = MAX_LIST_COUNT + 10;
      const KEY = 'key';

      await knex('expls').insert(
        _.times(COUNT, (i) => ({
          key: `like_${KEY}_${i}`,
          value: 'value',
          user_id: USER_ID,
        })),
      );

      const ctx = message(`/list ${KEY}`);
      await commands.list(ctx);
      expect(ctx.reply.args[0][0]).to.equal(messages.list.tooMany(KEY));
    });
  });

  describe('/quiz', async () => {
    const TOTAL_AMOUNT_OF_OPTIONS = AMOUNT_OF_EXPL_OPTIONS + 1; // Amount of expl options + "none of the above"

    it('can start a quiz with rexpl', async () => {
      await knex('expls').insert(
        _.times(10, (i) => ({
          key: `expl_${i}`,
          value: 'value',
          user_id: USER_ID,
        })),
      );

      const ctx = message('/quiz');
      await commands.quiz(ctx);

      expect(ctx.reply.callCount).to.equal(1);
      expect(ctx.reply.args[0][0]).to.equal('value');

      expect(ctx.replyWithQuiz.called).to.be.true;

      const args = ctx.replyWithQuiz.args[0];
      expect(args[0]).to.not.be.empty;
      expect(args[1]).to.have.length(TOTAL_AMOUNT_OF_OPTIONS);
      expect(args[2].correct_option_id).to.be.gte(0);
      expect(args[2].correct_option_id).to.be.lt(TOTAL_AMOUNT_OF_OPTIONS);
    });

    it('can start a quiz even if there is only few expls available', async () => {
      await knex('expls').insert(
        _.times(AMOUNT_OF_EXPL_OPTIONS - 1, (i) => ({
          key: `expl_${i}`,
          value: 'value',
          user_id: USER_ID,
        })),
      );

      const ctx = message('/quiz');
      await commands.quiz(ctx);

      expect(ctx.replyWithQuiz.called).to.be.true;

      const args = ctx.replyWithQuiz.args[0];
      expect(args[0]).to.not.be.empty;
      expect(args[1]).to.have.length(TOTAL_AMOUNT_OF_OPTIONS - 1);
    });

    it('print error if there is too few expls available', async () => {
      await knex('expls').insert({
        key: `expl`,
        value: 'value',
        user_id: USER_ID,
      });

      const ctx = message('/quiz');
      await commands.quiz(ctx);

      expect(ctx.replyWithQuiz.called).not.to.be.true;
      expect(ctx.reply.lastCall.args[0]).to.equal(
        messages.quiz.notEnoughOptions(),
      );
    });

    it('print error if there is no expls available', async () => {
      const ctx = message('/quiz');
      await commands.quiz(ctx);

      expect(ctx.replyWithQuiz.called).not.to.be.true;
      expect(ctx.reply.lastCall.args[0]).to.equal(messages.get.noExpls());
    });
  });

  describe('/me', async () => {
    describe('karma', async () => {
      it('responds even if user has no karma', async () => {
        const ctx = message('/me');
        await commands.me(ctx);
        expect(ctx.telegram.sendMessage.firstCall.args[1]).to.include(
          messages.me.stats(0, 0),
        );
      });

      it('calculates karma points from stats correctly', async () => {
        const stats = {
          likes: 5,
          dislikes: 4,
          echos: 40,
        };

        await knex('karma').insert({
          user_id: USER_ID,
          ...stats,
        });

        const points =
          db.KarmaMultipliers.likes * stats.likes +
          db.KarmaMultipliers.dislikes * stats.dislikes +
          db.KarmaMultipliers.echos * stats.echos;

        const ctx = message('/me');
        await commands.me(ctx);
        expect(ctx.telegram.sendMessage.firstCall.args[1]).to.include(
          messages.me.stats(0, points),
        );
      });

      describe("doesn't modify karma on actions to own expls", async () => {
        const EXPL: Partial<Table.Expl> = {
          id: 1,
          key: 'expl_0',
          value: 'value',
          user_id: USER_ID,
        };
        const FROM = { chat: -1, user: USER_ID };

        it('like', async () => {
          await knex('expls').insert(EXPL);
          await db.addReaction(FROM, EXPL.id!, '👍');

          const ctx = message('/me');
          await commands.me(ctx);
          expect(ctx.telegram.sendMessage.firstCall.args[1]).to.include(
            messages.me.stats(1, 0),
          );
        });

        it('dislike', async () => {
          await knex('expls').insert(EXPL);
          await db.addReaction(FROM, EXPL.id!, '👎');

          const ctx = message('/me');
          await commands.me(ctx);
          expect(ctx.telegram.sendMessage.firstCall.args[1]).to.include(
            messages.me.stats(1, 0),
          );
        });

        it('echo', async () => {
          await knex('expls').insert(EXPL);
          db.addEcho(EXPL as any, FROM, false, 1);

          const ctx = message('/me');
          await commands.me(ctx);
          expect(ctx.telegram.sendMessage.firstCall.args[1]).to.include(
            messages.me.stats(1, 0),
          );
        });
      });

      describe("modifies karma if someone else reacts to user's expl", async () => {
        const EXPL: Partial<Table.Expl> = {
          id: 1,
          key: 'expl_0',
          value: 'value',
          user_id: USER_ID,
        };

        const FROM = { chat: -1, user: 223456789 };

        it('like', async () => {
          await knex('expls').insert(EXPL);
          await db.addReaction(FROM, EXPL.id!, '👍');

          const ctx = message('/me');
          await commands.me(ctx);

          const karma = await db.getUserKarma(USER_ID);
          const karmaEscaped = escapeMarkdownV2(karma.toString());

          expect(karma).to.not.equal(0);
          expect(ctx.telegram.sendMessage.firstCall.args[1]).to.include(
            messages.me.stats(1, karmaEscaped),
          );
        });

        it('dislike', async () => {
          await knex('expls').insert(EXPL);
          await db.addReaction(FROM, EXPL.id!, '👎');

          const ctx = message('/me');
          await commands.me(ctx);

          const karma = await db.getUserKarma(USER_ID);
          const karmaEscaped = escapeMarkdownV2(karma.toString());

          expect(karma).to.not.equal(0);
          expect(ctx.telegram.sendMessage.firstCall.args[1]).to.include(
            messages.me.stats(1, karmaEscaped),
          );
        });

        it('echo', async () => {
          await knex('expls').insert(EXPL);
          await db.addEcho(EXPL as any, FROM, false, 1);

          const ctx = message('/me');
          await commands.me(ctx);

          const karma = await db.getUserKarma(USER_ID);
          const karmaEscaped = escapeMarkdownV2(karma.toString());

          expect(karma).to.not.equal(0);
          expect(ctx.telegram.sendMessage.firstCall.args[1]).to.include(
            messages.me.stats(1, karmaEscaped),
          );
        });
      });
    });
  });

  describe('/viral', () => {
    it('reply when not enough data', async () => {
      const ctx = message('/viral', true);
      await commands.viral(ctx);

      expect(ctx.reply.lastArg).to.equal(messages.viral.notEnoughData());
    });

    it('list recent most liked expls', async () => {
      const COUNT = 4;
      const EXTRALIKEDKEY = 2;

      await knex('expls').insert(
        _.times(COUNT, (i) => ({
          key: `key_${i}`,
          value: 'value',
          user_id: USER_ID,
        })),
      );

      const expls = await knex('expls');

      for (const expl of expls) {
        await knex('reactions').insert({
          user_id: USER_ID,
          expl_id: expl.id,
          chat_id: GROUP_ID,
          reaction: '👍',
        });
      }

      // add extra like for one expl
      await knex('reactions').insert({
        user_id: 999999,
        expl_id: expls[EXTRALIKEDKEY].id,
        chat_id: GROUP_ID,
        reaction: '👍',
      });

      const ctx = message('/viral', true);
      await commands.viral(ctx);

      expect(ctx.reply.lastArg).to.contain(`1. ${expls[EXTRALIKEDKEY].key}`);
    });
  });
});
