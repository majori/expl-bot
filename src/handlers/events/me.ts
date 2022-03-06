import * as _ from 'lodash';
import type { CallbackQuery, User, Message } from 'typegram';

import * as db from '../../database';
import { formatDate } from '../../utils';
import type { Context } from '../../types/telegraf';
import logger from '../../logger';
import * as messages from '../../constants/messages';
import { sendExpl } from '../../utils';
import { escapeMarkdownV2 } from '../../utils';

const DATA_SEPARATOR = '|';
const EXPLS_IN_PAGE = 5;

type page = 'latest' | 'oldest' | 'best' | 'worst' | 'likes';

function getListTitle(page: page) {
  const titleMap = {
    latest: messages.me.latestByYou(),
    oldest: messages.me.oldestByYou(),
    best: messages.me.bestByYou(),
    worst: messages.me.worstByYou(),
    likes: messages.me.likedByYou(),
  };

  return titleMap[page] || '';
}

function button(text: string, data: string | string[]) {
  return {
    text,
    callback_data: ['medata', ..._.castArray(data)].join(DATA_SEPARATOR),
  };
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

function explsList(list: any[], page: page, offset: number = 0) {
  if (list.length < 1) {
    return messages.me.empty();
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
  const worstExpls: any[] = await db.getExlpsMadeByUser(
    user,
    'worst',
    EXPLS_IN_PAGE,
  );

  switch (page) {
    case 'selfmade':
      return [
        [
          button(messages.me.mostLiked(), 'best'),
          button(messages.me.leastLiked(), 'worst'),
        ],
        /*
          WIP
          [button('Latest', 'latest'), button('Oldest', 'oldest')], 
        */
        [button('⬅️ Go back', 'home')],
      ];

    case 'best':
    case 'latest':
    case 'oldest':
      return [[button(messages.me.goBack(), 'selfmade')]];

    case 'worst':
      if (worstExpls.length > 0) {
        return [
          [button(messages.me.reviewAbove(), 'review')],
          [button(messages.me.goBack(), 'selfmade')],
        ];
      } else {
        return [[button(messages.me.goBack(), 'selfmade')]];
      }

    case 'review':
      const mappedExpls = worstExpls.map(({ key }) => [
        button(key, ['review', key]),
      ]);
      return [...mappedExpls, [button(messages.me.goBack(), 'worst')]];

    case 'likes':
      const likedExpls = await db.getExlpsLikedByUser(user);

      if (likedExpls.length <= EXPLS_IN_PAGE) {
        return [[button(messages.me.goBack(), 'home')]];
      }

      const prevOffset = `${offset - EXPLS_IN_PAGE}`;
      const nextOffset = `${offset + EXPLS_IN_PAGE}`;

      return [
        [
          button(messages.me.prev(), ['likes', prevOffset]),
          button(messages.me.next(), ['likes', nextOffset]),
        ],
        [button(messages.me.goBack(), 'home')],
      ];

    default:
      return [
        [
          button(messages.me.madeByMe(), 'selfmade'),
          button(messages.me.likedByMe(), 'likes'),
        ],
      ];
  }
}

export async function meText(
  user: number,
  page: string = 'home',
  offset?: number,
) {
  switch (page) {
    case 'selfmade':
      return messages.me.whichBasis();

    case 'likes':
      const likedExpls = await db.getExlpsLikedByUser(
        user,
        EXPLS_IN_PAGE,
        offset,
      );

      return explsList(likedExpls, page);

    case 'review':
      return messages.me.clickToRemove();

    case 'best':
    case 'worst':
      const usersExpls = await db.getExlpsMadeByUser(user, page, EXPLS_IN_PAGE);

      return explsList(usersExpls, page);

    case 'home':
    default:
      return messages.me.exploreMore();
  }
}

export async function statsText(user: User) {
  const amount = await db.getExlpCountByUser(user.id);
  const karma = await db.getUserKarma(user.id);
  const best = await db.getExlpsMadeByUser(user.id, 'best', 1);
  const answers = await db.getQuizAnswersByUser(user.id);

  const helloText = _.isEmpty(user.username)
    ? messages.me.helloStranger()
    : messages.me.hello(user.username);

  const karmaEscaped = escapeMarkdownV2(karma.toString());

  const statTexts = [
    [helloText, messages.me.stats(amount, karmaEscaped)].join(' '),
  ];

  if (!_.isEmpty(best)) {
    statTexts.push(messages.me.bestSoFar(escapeMarkdownV2(best[0].key)));
  }

  if (answers.total > 0) {
    const succesRate = 100 * _.round(answers.right / answers.total, 2);
    statTexts.push(messages.me.quizAnswers(answers.total, succesRate));
  }

  return statTexts.join('\n\n');
}

export async function meKeyboard(
  user: number,
  page: string = 'home',
  offset?: number,
) {
  const keyboard = await createKeyboard(user, page, offset);

  return { inline_keyboard: keyboard };
}

async function reviewKey(ctx: Context, user: number, key: string) {
  const expl = await db.getOwnExpl(user, key);

  if (!expl) {
    return ctx.answerCbQuery(messages.reaction.creatorHasRemoved());
  }

  const msg = await sendExpl(ctx, key, expl);

  const text = messages.me.removalAssurance(key);

  const replyTo = msg!.message_id;
  await ctx.telegram.sendMessage(user, text, {
    reply_markup: {
      inline_keyboard: [
        [button(messages.me.deletePermanently(), ['remove', key])],
        [button(messages.me.cancel(), 'removeReview')],
      ],
    },
    reply_to_message_id: replyTo,
  });

  ctx.answerCbQuery();
}

export async function meNavigate(ctx: Context) {
  const cbQuery = ctx.callbackQuery as
    | CallbackQuery.DataCallbackQuery
    | undefined;
  if (!cbQuery || !cbQuery.data) {
    return;
  }

  const user = cbQuery.from.id;

  const [, page, meta] = cbQuery.data.split(DATA_SEPARATOR);

  if (page === 'likes') {
    const offset = meta ? +meta : 0;

    if (offset < 0) {
      return ctx.answerCbQuery(messages.me.listBeginning());
    }

    const likedExpls = await db.getExlpsLikedByUser(user);

    if (offset >= likedExpls.length && likedExpls.length > 0) {
      return ctx.answerCbQuery(messages.me.listEnd());
    }

    ctx.session ??= {};
    ctx.session.meOffset = offset;
  }

  const keyboard = await meKeyboard(user, page, ctx.session?.meOffset);

  if (page === 'review' && !_.isEmpty(meta)) {
    await reviewKey(ctx, user, meta);

    return;
  }

  if (page === 'removeReview' || page === 'remove') {
    ctx.deleteMessage();
    ctx.deleteMessage(
      (cbQuery.message as Message.TextMessage)?.reply_to_message?.message_id,
    );

    if (page === 'remove' && !_.isEmpty(meta)) {
      const count = await db.deleteExpl(user, meta);

      return count > 0
        ? ctx.reply(messages.remove.successful(meta))
        : ctx.reply(messages.errors.notFound(meta));
    }

    ctx.answerCbQuery();

    return;
  }

  const text = await meText(user, page, ctx.session?.meOffset);

  try {
    await ctx.editMessageText(text, { reply_markup: keyboard });
  } catch (err) {
    logger.error(err);
  }
}
