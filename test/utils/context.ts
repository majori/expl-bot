import * as sinon from 'sinon';
import * as Telegraf from 'telegraf';

const baseContext = (state?: any) => {
  return {
    state,
    session: { joined: true },
    reply: sinon.fake(),
    replyWithMarkdown: sinon.fake(),
    answerInlineQuery: sinon.fake(),
    telegram: {
      forwardMessage: sinon.fake(),
      webkhookReply: sinon.fake(),
    },
  };
};

export const message = (msg: string, fromGroup?: boolean): any => {
  const chat = fromGroup ?
    {
      id: -1001184985530,
      title: 'expl-bot dev group',
      type: 'supergroup',
    } :
    {
      id: 123456789,
      first_name: 'Test',
      last_name: 'User',
      username: 'testuser',
    };

  return {
    ...baseContext({
      user: 123456789,
      chat: chat.id,
    }),
    message: {
      message_id: 1234,
      from: {
        id: 123456789,
        is_bot: false,
        first_name: 'Test',
        last_name: 'User',
        username: 'testuser',
      },
      chat,
      date: Date.now(),
      text: msg,
    },
  };
};
