import 'mocha';
import { expect } from 'chai';
import config from '../src/config';
import * as commands from '../src/commands';
import { message } from './utils/context';
import { knex, clearDb } from './helper';

describe('Commands', () => {
  beforeEach(clearDb);
  after(async () => knex.destroy());

  describe('/expl', () => {
    it('will respond with error if expl not found', async () => {
      const ctx = message('?? NOT_FOUND');
      await commands.getExpl(ctx);
      expect(ctx.reply.lastArg).to.equal('Expl not found.');
    });

    it('will get an existing expl', async () => {
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
  });
});
