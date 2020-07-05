import { createExpl } from './add';
import { getExpl, getRandomExpl } from './get';
import { searchExpls } from './list';
import { removeExpl } from './remove';
import { printHelp } from './help';
import { resolveRexpl } from './resolve';
import { toggleReaction } from './reaction';
import { startQuiz } from './quiz';
import { getKarma } from './karma';

export default {
  add: createExpl,
  expl: getExpl,
  rexpl: getRandomExpl,
  list: searchExpls,
  remove: removeExpl,
  help: printHelp,
  resolve: resolveRexpl,
  reaction: toggleReaction,
  quiz: startQuiz,
  karma: getKarma,
};
