import { handleInlineQuery } from '../handlers/inline-query';
import { handlePollAnswer } from '../handlers/poll-answer';

export default {
  inlineQuery: handleInlineQuery,
  pollAnswer: handlePollAnswer,
};
