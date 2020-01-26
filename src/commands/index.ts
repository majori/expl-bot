import { createExpl } from './add';
import { getExpl, getRandomExpl } from './get';
import { handleInlineQuery } from './inline-query';
import { searchExpls } from './list';
import { removeExpl } from './remove';
import { printHelp } from './help';
import { resolveRexpl } from './resolve';
import { toggleReaction } from './reaction';
import { startQuiz } from './quiz';

export default {
  add: createExpl,
  expl: getExpl,
  rexpl: getRandomExpl,
  list: searchExpls,
  remove: removeExpl,
  inlineQuery: handleInlineQuery,
  help: printHelp,
  resolve: resolveRexpl,
  reaction: toggleReaction,
  quiz: startQuiz,
};
