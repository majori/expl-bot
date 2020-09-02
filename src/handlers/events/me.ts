import * as _ from 'lodash';
import * as db from '../../database';
import { formatDate } from '../../utils';
import type { Context } from '../../types/telegraf';
import Logger from '../../logger';
import * as messages from '../../constants/messages';
import { sendExpl } from '../../utils';

const logger = new Logger(__filename);

const DATA_SEPARATOR = '|';
const EXPLS_IN_PAGE = 5;

function getListTitle(page: string) {
  switch (page) {
    case 'latest':
      return 'Expls made by you, starting with latest:';
    case 'oldest':
      return 'Expls made by you, starting with oldest:';
    case 'best':
      return 'Expls made by you, most liked:';
    case 'worst':
      return 'Expls made by you, least liked:';
    case 'likes':
      return 'Expls liked by you but made by others, starting with latest like:';
    default:
      return '';
  }
}

function button(text: string, data: string | string[]) {
  if (_.isString(data)) {
    data = [data];
  }

  return { text, callback_data: ['medata', ...data].join(DATA_SEPARATOR) };
}

function explsListItem(
  key: string,
  count: number,
  created: string,
  index: number,
  page: string,
) {
  switch (page) {
    case 'best':
    case 'worst':
      return `${index}. ${key} (${count})`;

    case 'latest':
    case 'oldest':
    default:
      return `${key}, ${formatDate(created)}`;
  }
}

function explsList(list: any[], page: string, offset: number = 0) {
  if (list.length < 1) {
    return 'Oops, nothing to show!';
  }

  const title = getListTitle(page);

  const items = list.map((expl, index) => {
    const { key, count, created_at } = expl;
    return explsListItem(key, count, created_at, 1 + index + offset, page);
  });

  return [title, ...items].join('\n');
}

async function createKeyboard(
  user: number,
  page: string = 'home',
  offset: number = 0,
) {
  switch (page) {
    case 'selfmade':
      return [
        [button('👍 Most liked', 'best'), button('👎 Least liked', 'worst')],
        /*
          WIP
          [button('Latest', 'latest'), button('Oldest', 'oldest')], 
        */
        [button('⬅️ Go back', 'home')],
      ];

    case 'best':
    case 'latest':
    case 'oldest':
      return [[button('⬅️ Go back', 'selfmade')]];

    case 'worst':
      return [
        [button('Review above expls', 'review')],
        [button('⬅️ Go back', 'selfmade')],
      ];

    case 'review':
      const worstExpls: any[] = await db.getExlpsMadeByUser(user, 'worst');
      const mappedExpls = worstExpls.map(({ key }) => [
        button(key, ['review', key]),
      ]);
      return [...mappedExpls, [button('⬅️ Go back', 'worst')]];

    case 'likes':
      const likedExpls = await db.getExlpsLikedByUser(user);

      if (likedExpls.length <= EXPLS_IN_PAGE) {
        return [[button('⬅️ Go back', 'home')]];
      }

      const prevOffset = `${offset - EXPLS_IN_PAGE}`;
      const nextOffset = `${offset + EXPLS_IN_PAGE}`;
      return [
        [
          button('Previous', ['likes', `${prevOffset}`]),
          button('Next', ['likes', `${nextOffset}`]),
        ],
        [button('⬅️ Go back', 'home')],
      ];

    default:
      return [
        [button('Made by me', 'selfmade'), button('Liked by me', 'likes')],
      ];
  }
}

async function meText(user: number, page: string = 'home', offset?: number) {
  switch (page) {
    case 'selfmade':
      return 'On which basis would you like to browse your expls?';

    case 'likes':
      const likedExpls = await db.getExlpsLikedByUser(
        user,
        EXPLS_IN_PAGE,
        offset,
      );

      return explsList(likedExpls, page);

    case 'review':
      return 'If you click expl below, that expl will be displayed with a prompt to remove it.';

    case 'best':
    case 'worst':
      const usersExpls = await db.getExlpsMadeByUser(user, page);

      return explsList(usersExpls, page);

    case 'home':
    default:
      return 'What kind of expls are you looking for?';
  }
}

export async function meKeyboard(ctx: Context, page: string = 'home') {
  const keyboard = await createKeyboard(
    ctx.from!.id,
    page,
    ctx.session.meOffset,
  );

  return { inline_keyboard: keyboard };
}

export async function meStart(ctx: Context) {
  const keyboard = await meKeyboard(ctx);
  const text = await meText(+ctx.from!.id, 'home');

  await ctx.telegram.sendMessage(+ctx.from!.id, text, {
    reply_markup: keyboard,
  });
}

async function reviewKey(ctx: Context, key: string) {
  const expl = await db.getExpl(ctx.from!.id, key);

  if (!expl) {
    return ctx.answerCbQuery(messages.reaction.creatorHasRemoved());
  }

  const msg = await sendExpl(ctx, key, expl);

  const text = `Do want to remove this expl ("${key}")? This action can not be undone.`;

  const replyTo = msg!.message_id;
  await ctx.telegram.sendMessage(+ctx.from!.id, text, {
    reply_markup: {
      inline_keyboard: [
        [button('Yes, delete it permanently!', ['remove', key])],
        [button('Cancel', 'removeReview')],
      ],
    },
    reply_to_message_id: replyTo,
  });

  ctx.answerCbQuery();
}

export async function meNavigate(ctx: Context) {
  if (!ctx.callbackQuery || !ctx.callbackQuery.data) {
    return;
  }

  const [, page, meta] = ctx.callbackQuery.data.split(DATA_SEPARATOR);

  if (page === 'likes') {
    const offset = meta ? +meta : 0;

    if (offset < 0) {
      return ctx.answerCbQuery('You are at beginning of the list');
    }

    const likedExpls = await db.getExlpsLikedByUser(ctx.from!.id);

    if (offset >= likedExpls.length) {
      return ctx.answerCbQuery('You have reached the end of the list');
    }

    ctx.session.meOffset = offset;
  }

  const keyboard = await meKeyboard(ctx, page);

  if (page === 'review' && !_.isEmpty(meta)) {
    await reviewKey(ctx, meta);

    return;
  }

  if (page === 'removeReview' || page === 'remove') {
    ctx.deleteMessage();
    ctx.deleteMessage(ctx.callbackQuery.message?.reply_to_message?.message_id);

    if (page === 'remove' && !_.isEmpty(meta)) {
      const count = await db.deleteExpl(ctx.from!.id, meta);

      return count > 0
        ? ctx.reply(messages.remove.successful(meta))
        : ctx.reply(messages.errors.notFound(meta));
    }

    ctx.answerCbQuery();

    return;
  }

  const text = await meText(+ctx.from!.id, page, ctx.session.meOffset);

  try {
    await ctx.editMessageText(text, { reply_markup: keyboard });
  } catch (err) {
    logger.error(err);
  }
}
