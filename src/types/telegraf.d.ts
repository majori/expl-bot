import * as Telegraf from 'telegraf';

export interface Context extends Telegraf.ContextMessageUpdate {
  session: {
    joined: boolean;
  };
  state: {
    user: number;
    chat: number;
  };
}
