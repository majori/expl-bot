import 'mocha';
import { expect } from 'chai';
import * as _ from 'lodash';
import config from '../src/config';
import * as commands from '../src/commands';
import { message, USER_ID } from './utils/context';
import { knex, clearDb } from './helper';

describe('Commands', () => {
  beforeEach(clearDb);
  after(async () => knex.destroy());

  describe('/expl', () => {
    it('respond with error if expl not found', async () => {
      const ctx = message('?? NOT_FOUND');
      await commands.getExpl(ctx);
      expect(ctx.reply.lastArg).to.equal('Expl not found.');
    });

    it('get an existing expl', async () => {
      const expl = {
        key: 'key',
        value: 'value',
      };

      const ctx = message('?? key');
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

      await knex('expls').insert(expls);

      for (const [index, user] of users.entries()) {
        const ctx = message(`?? ${KEY} ${index + 1}`);
        await commands.getExpl(ctx);

        expect(ctx.reply.lastArg).to.equal(`${KEY}: ${index}`);
      }
    });
  });

  describe('/add', () => {
    it('creates expl');
    it('prevents user to create multiple expls with same key');
  });
});
