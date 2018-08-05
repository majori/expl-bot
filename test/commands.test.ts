import 'mocha';
import { expect } from 'chai';
import * as _ from 'lodash';
import * as commands from '../src/commands';
import { message, USER_ID } from './utils/context';
import { knex, clearDb } from './helper';

describe('Commands', () => {
  beforeEach(clearDb);
  after(async () => knex.destroy());

  describe('/expl', () => {
    it('respond with error if expl not found', async () => {
      const ctx = message('/expl NOT_FOUND');
      await commands.getExpl(ctx);
      expect(ctx.reply.lastArg).to.equal('Expl not found.');
    });

    it('get an existing expl', async () => {
      const expl = {
        key: 'key',
        value: 'value',
      };

      const ctx = message(`/expl ${expl.key}`);
      await knex('expls').insert({
        ...expl,
        user_id: ctx.message.from.id,
      });

      await commands.getExpl(ctx);
      expect(ctx.reply.lastArg).to.equal(`${expl.key}: ${expl.value}`);
    });

    it('correctly gets indexed expl', async () => {
      const users = [USER_ID, 223456789, 323456789, 423456789];

      // Make user to be in the same group
      await knex('auth')
        .insert(_.map(users, (user) => ({
          user_id: user,
          chat_id: -123456789,
        })));

      const KEY = 'key';
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
        await commands.getExpl(ctx);

        expect(ctx.reply.lastArg).to.equal(`${KEY}: ${index}`);
      }
    });
  });

  describe('/add', () => {
    it('creates expl', async () => {
      const expl = {
        key: 'key',
        value: 'value',
      };
      const ctx = message(`/add ${expl.key} ${expl.value}`);
      await commands.createExpl(ctx);

      const expls = await knex('expls');

      expect(expls).to.have.length(1);
      expect(ctx.reply.lastArg).to.equal('Expl created!');
      expect(_.first(expls)).to.have.property('key', expl.key);
      expect(_.first(expls)).to.have.property('value', expl.value);
    });

    it('prevents user to create multiple expls with same key', async () => {
      const expl = {
        key: 'key',
        value: 'value',
      };

      const ctx = message(`/add ${expl.key} ${expl.value}`);
      await commands.createExpl(ctx);
      await commands.createExpl(ctx);

      expect(await knex('expls')).to.have.length(1);
      expect(ctx.reply.lastArg).to.equal(`You already have expl with the key "${expl.key}".`);
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
      await commands.removeExpl(ctx);

      expect(await knex('expls')).to.be.empty;
    });

    it('responds with error if key does not exist', async () => {
      const KEY = 'key';
      const ctx = message(`/remove ${KEY}`);
      await commands.removeExpl(ctx);

      expect(ctx.reply.lastArg).to.equal(`Expl "${KEY}" not found.`);
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

      await commands.removeExpl(ctx);
      expect(await knex('expls')).to.have.length(1);

      await commands.removeExpl(ctx);
      expect(await knex('expls')).to.have.length(1);
      expect(ctx.reply.lastArg).to.equal(`Expl "${expl.key}" not found.`);
    });

  });
});
