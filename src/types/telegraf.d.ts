import * as Telegraf from 'telegraf';

// These types are missing from the telegraf types
declare module 'telegraf' {
  interface Telegraf<C extends Telegraf.ContextMessageUpdate> {
    telegram: Telegram;
    options: {
      username: string;
    };
  }

  interface Telegram {
    getMe(): Promise<{ username: string }>;
    setWebhook(url: string): Promise<any>;
    deleteWebhook(): Promise<any>;
    forwardMessage(chatId: string | number, fromChatId: string | number, messageId: number): Promise<any>;
  }
}

export interface Context extends Telegraf.ContextMessageUpdate {
  state: {
    user: number;
    chat: number;
  };
}
