import * as Telegraf from 'telegraf';

export interface Context extends Telegraf.Context {
  session: {
    joined: boolean;
  };
}
