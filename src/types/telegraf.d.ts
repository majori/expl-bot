import type { Context as C } from 'telegraf';

export interface SessionData {
  joined: boolean;
  meOffset: number;
  reactionToBeDeleted: number | null;
}

export interface Context extends C {
  session?: SessionData;
}
