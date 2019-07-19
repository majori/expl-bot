import * as Telegraf from 'telegraf';

// These types are missing from the telegraf types
declare module 'telegraf' {
  interface Telegram {
    forwardMessage(chatId: string | number, fromChatId: string | number, messageId: number): Promise<any>;
  }
}

export interface Context extends Telegraf.ContextMessageUpdate {
  session: {
    joined: boolean;
  };
  state: {
    user: number;
    chat: number;
  };
}
