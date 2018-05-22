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
  }
}

export interface Context extends Telegraf.ContextMessageUpdate {
  state: {
    user: number;
    chat: number;
  };
}
