import * as Telegraf from 'telegraf';

// These types are missing from the telegraf types
declare module 'telegraf' {
  interface Telegram {
    forwardMessage(
      chatId: string | number,
      fromChatId: string | number,
      messageId: number,
    ): Promise<any>;
  }

  // Polyfill, should be unnecessary when Telegraf 3.31.0 is released at npm
  interface Composer<TContext extends ContextMessageUpdate> {
    action(
      triggers: Telegraf.HearsTriggers,
      middleware: Telegraf.Middleware<TContext>,
      ...middlewares: Array<Telegraf.Middleware<TContext>>
    ): Telegraf.Composer<TContext>;
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
