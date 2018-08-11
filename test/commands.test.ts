import 'mocha';
import { expect } from 'chai';
import * as _ from 'lodash';
import commands from '../src/commands';
import * as messages from '../src/constants/messages';
import { message, USER_ID } from './utils/context';
import { knex, clearDb } from './helper';

describe('Commands', () => {
  beforeEach(clearDb);

  describe('/expl', () => {
    it('respond with error if expl not found', async () => {
      const KEY = 'NOT_FOUND';
      const ctx = message(`/expl ${KEY}`);
      await commands.expl(ctx);
      expect(ctx.reply.lastArg).to.equal(messages.errors.notFound(KEY));
    });

    it('get an existing expl', async () => {
      const expl = {
        key: 'key',
        value: 'value',
      };

      const ctx = message(`/expl ${expl.key}`);
      await knex('expls').insert({
        ...expl,
        user_id: USER_ID,
      });

      await commands.expl(ctx);
      expect(ctx.reply.lastArg).to.equal(`${expl.key}: ${expl.value}`);
    });

    it('correctly gets indexed expl', async () => {
      const KEY = 'key';
      const users = [USER_ID, 223456789, 323456789, 423456789];

      // Make user to be in the same group
      await knex('auth')
        .insert(_.map(users, (user) => ({
          user_id: user,
          chat_id: -123456789,
        })));

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

        expect(ctx.reply.lastArg).to.equal(`${KEY}: ${index}`);
      }
    });

    it('updates echo_count and last_echo after sending expl', async () => {
      const KEY = 'key';

      await knex('expls').insert({
        key: KEY,
        value: 'value',
        user_id: USER_ID,
      });

      await commands.expl(message(`/expl ${KEY}`));

      const expl1 = await knex('expls').where('key', KEY).first();
      expect(expl1.echo_count).to.equal(1);
      expect(expl1.last_echo).to.be.not.null;

      await commands.expl(message(`/expl ${KEY}`));
      const expl2 = await knex('expls').where('key', KEY).first();
      expect(expl2.echo_count).to.equal(2);
      expect(expl2.last_echo).to.not.equal(expl1.last_echo);
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
      expect(ctx.reply.lastArg).to.equal(messages.add.successful());
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
    it('searches keys with given search term');
    it('shows amount of duplicate keys found');
    it('responds with error if no keys found');
    it('responds with error if search results contains over 100 keys');
  });
});
