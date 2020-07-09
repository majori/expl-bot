import * as Knex from 'knex';

export async function up(knex: Knex): Promise<any> {
  await knex.schema.alterTable('expls', (t) => {
    t.dropColumn('echo_count');
    t.dropColumn('last_echo');
  });
}

export async function down(knex: Knex): Promise<any> {
  await knex.schema.alterTable('expls', (t) => {
    t.integer('echo_count')
      .defaultTo(0)
      .comment('How many times this expl has been requested');
    t.timestamp('last_echo').comment(
      'Last time this expl was echoed somewhere',
    );
  });
}
