import * as _ from 'lodash';
import * as db from '../database';
import * as config from '../config';
import { Context } from '../types/telegraf';
import { Table } from '../types/database';

export const RESULT_LIMIT = 15;

export const handleInlineQuery = async (ctx: Context) => {
  const query = ctx.inlineQuery!.query;

  const expls = await (_.isEmpty(query)
    ? db.searchRexpls(ctx.state.user)
    : db.searchExpls(ctx.state.user, query, RESULT_LIMIT, true));
  const results = _.map(expls, (expl) => getInlineResult(expl));

  return ctx.answerInlineQuery(results as any, {
    switch_pm_text: _.isEmpty(query) ? 'Bot commands' : undefined,
    switch_pm_parameter: _.isEmpty(query) ? 'commands' : undefined,
    is_personal: true,
    cache_time: config.env.prod ? undefined : 0, // Cache only in production
  });
};

const getInlineResult = (
  expl: Partial<Table.Expl> & Partial<Table.TgContents>,
) => {
  const inlineOpt = {
    title: expl.key,
    id: expl.key,
    input_message_content: { message_text: `/expl ${expl.key}` },
  };

  if (expl.photo_id) {
    return {
      type: 'photo',
      photo_file_id: expl.photo_id,
      ...inlineOpt,
    };
  }

  if (expl.video_id) {
    return {
      type: 'video',
      video_file_id: expl.video_id,
      ...inlineOpt,
    };
  }

  if (expl.sticker_id) {
    return {
      type: 'sticker',
      sticker_file_id: expl.sticker_id,
      ...inlineOpt,
    };
  }

  return {
    type: 'article',
    ...inlineOpt,
  };
};
