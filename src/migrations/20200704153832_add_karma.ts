import * as Knex from 'knex';
import * as _ from 'lodash';

export async function up(knex: Knex): Promise<any> {
  await knex.schema.createTable('karma', (t) => {
    t.string('user_id').primary();
    t.integer('likes').unsigned().defaultTo(0);
    t.integer('dislikes').unsigned().defaultTo(0);
    t.integer('echos').unsigned().defaultTo(0);
  });

  const reactions: any[] = await knex
    .select('expls.user_id')
    .count({
      likes: knex.raw("CASE reactions.reaction WHEN '👍' THEN 1 ELSE NULL END"),
      dislikes: knex.raw(
        "CASE reactions.reaction WHEN '👎' THEN 1 ELSE NULL END",
      ),
    })
    .from('expls')
    .innerJoin('reactions', 'reactions.expl_id', 'expls.id')
    .whereRaw('reactions.user_id != expls.user_id') // Ignore reactions to own expls
    .groupBy('expls.user_id');

  const echos: any[] = await knex
    .select('expls.user_id')
    .count({ echos: '*' })
    .from('echo_history')
    .innerJoin('expls', 'echo_history.expl_id', 'expls.id')
    .whereRaw('echo_history.user_id != expls.user_id') // Ignore echos to own expls
    .andWhereRaw('echo_history.was_random = FALSE')
    .groupBy('expls.user_id');

  // Combine queries by user_id
  const karma = _.reduce(
    [...reactions, ...echos],
    (memo, item) => {
      memo[item.user_id] = _.assign(memo[item.user_id] || {}, item);
      return memo;
    },
    {} as any,
  );

  await knex('karma').insert(_.toArray(karma));
}

export async function down(knex: Knex): Promise<any> {
  await knex.schema.dropTable('karma');
}
