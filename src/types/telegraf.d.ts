import type { Context as C } from 'telegraf';

export interface SessionData {
  meOffset?: number;
  reactionToBeDeleted?: number | null;
}

export interface Context extends C {
  session?: SessionData;
}
