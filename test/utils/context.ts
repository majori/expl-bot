import * as sinon from 'sinon';

const baseContext = (state?: any) => {
  return {
    state,
    session: { joined: true },
    reply: sinon.fake.returns({
      message_id: 1235,
    }),
    replyWithMarkdown: sinon.fake(),
    replyWithQuiz: sinon.fake.returns({
      poll: {
        id: '1234',
      },
    }),
    answerInlineQuery: sinon.fake(),
    answerCbQuery: sinon.fake(),
    editMessageReplyMarkup: sinon.fake(),
    telegram: {
      sendMessage: sinon.fake(),
      forwardMessage: sinon.fake(),
      webkhookReply: sinon.fake(),
    },
  };
};

export const USER_ID = 123456789;
export const GROUP_ID = -1001184985530;

const user = {
  id: USER_ID,
  is_bot: false,
  first_name: 'Test',
  last_name: 'User',
  username: 'testuser',
};

export const message = (
  msg: string,
  fromGroup?: boolean,
  replyTo?: number,
): any => {
  const chat = fromGroup
    ? {
        id: GROUP_ID,
        title: 'expl-bot dev group',
        type: 'supergroup',
      }
    : {
        id: USER_ID,
        first_name: 'Test',
        last_name: 'User',
        username: 'testuser',
      };

  return {
    ...baseContext(),
    from: { id: USER_ID },
    chat: { id: chat.id },
    message: {
      message_id: 1234,
      from: user,
      chat,
      date: Date.now(),
      text: msg,
      reply_to_message: replyTo ? { message_id: replyTo } : null,
    },
  };
};

export function inlineQuery(query?: string): any {
  return {
    ...baseContext(),
    inlineQuery: {
      id: 'INLINE_QUERY_ID',
      from: user,
      query,
      offset: '',
    },
    from: { id: USER_ID },
  };
}

export function callbackQuery(data: string): any {
  return {
    ...baseContext(),
    callbackQuery: { data },
    from: { id: USER_ID },
    chat: { id: GROUP_ID },
  };
}
