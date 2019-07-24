import * as sinon from 'sinon';

const baseContext = (state?: any) => {
  return {
    state,
    session: { joined: true },
    reply: sinon.fake.returns({
      message_id: 1235,
    }),
    replyWithMarkdown: sinon.fake(),
    answerInlineQuery: sinon.fake(),
    answerCbQuery: sinon.fake(),
    editMessageReplyMarkup: sinon.fake(),
    telegram: {
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

export const message = (msg: string, fromGroup?: boolean, replyTo?: number): any => {
  const chat = fromGroup ?
    {
      id: GROUP_ID,
      title: 'expl-bot dev group',
      type: 'supergroup',
    } :
    {
      id: USER_ID,
      first_name: 'Test',
      last_name: 'User',
      username: 'testuser',
    };

  return {
    ...baseContext({
      user: USER_ID,
      chat: chat.id,
    }),
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

export const inlineQuery = (query?: string): any => {
  return {
    inlineQuery: {
      id: 'INLINE_QUERY_ID',
      from: user,
      query,
      offset: '',
    },
    ...baseContext({
      user: USER_ID,
    }),
  };
};

export const callbackQuery = (data: string): any => {
  return {
    callbackQuery: { data },
    ...baseContext({
      user: USER_ID,
    }),
  };
};
