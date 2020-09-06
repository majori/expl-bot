import { createExpl } from './add';
import { getExpl, getRandomExpl } from './get';
import { searchExpls } from './list';
import { removeExpl } from './remove';
import { printHelp } from './help';
import { resolveRexpl } from './resolve';
import { startQuiz } from './quiz';
import { meStart } from '../events/me';

export default {
  add: createExpl,
  expl: getExpl,
  rexpl: getRandomExpl,
  list: searchExpls,
  remove: removeExpl,
  help: printHelp,
  resolve: resolveRexpl,
  quiz: startQuiz,
  me: meStart,
};
