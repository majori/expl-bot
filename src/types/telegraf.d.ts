import type { Context as C } from 'telegraf';

export interface SessionData {
  meOffset?: number;
  reactionToBeDeleted?: {
    id: number;
    timestamp: number;
  };
}

export interface Context extends C {
  session: SessionData;
}
