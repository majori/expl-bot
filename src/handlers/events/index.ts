import { handleInlineQuery } from './inline-query';
import { handlePollAnswer } from './poll-answer';
import { toggleReaction } from './reaction';

export default {
  inlineQuery: handleInlineQuery,
  pollAnswer: handlePollAnswer,
  reaction: toggleReaction,
};
