import { handleInlineQuery } from './inline-query';
import { handlePollAnswer } from './poll-answer';
import { toggleReaction } from './reaction';
import { meNavigate } from './me';

export default {
  inlineQuery: handleInlineQuery,
  pollAnswer: handlePollAnswer,
  reaction: toggleReaction,
  me: meNavigate,
};
