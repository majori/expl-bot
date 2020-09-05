// tslint:disable max-line-length
import * as template from 'string-template/compile';
import { constant } from 'lodash';

export const errors = {
  notFound: template('Expl "{0}" not found.'),
  unknownError: constant('Unknown error occurred :/'),
};

export const add = {
  successful: template('Expl "{0}" created!'),
  successfulWithDisclaimer: template(
    'Expl "{0}" created! (If you want to use multiple words in a key, use _ between words)',
  ),
  tooLong: template('Message has to be less than {0} characters.'),
  duplicate: template('You already have expl with the key "{0}".'),
  invalidSyntax: template(
    'Try `{0} [key] [value]` or reply to any message with `{0} [key]`',
  ),
};

export const list = {
  invalidSyntax: template('Try `{0} [key]`'),
  notFound: template('No expls found with key like "{0}".'),
  tooMany: template(
    'Found over 100 expls with key like "{0}". Try to narrow it down.',
  ),
};

export const remove = {
  successful: template('Expl "{0}" removed.'),
  invalidSyntax: template('Try `{0} [key]`'),
};

export const get = {
  forbidden: constant(
    'Expl cannot be shown since the user or the chat has blocked the bot 😢',
  ),
  invalidSyntax: template('Try `{0} [key]`'),
  noExpls: constant("Can't find any expl for you :/"),
};

export const resolve = {
  notExpl: constant('Replied message was not an expl'),
  noReply: constant('Reply to an expl to find out its key'),
};

export const help = constant(`
/expl or ?? \`[key]\`
  - Get a expl with the given key
/rexpl or ?!
  - Get a random expl
/resolve or !rs
  - Finds key of a expl
/add or !add \`[key]\` \`[value or reply]\`
  - Creates a expl with the given key and value. Value can be omitted if using reply to other message.
/remove or !rm \`[key]\`
  - Removes your own expl with the given key
/list or !ls \`[search term]\`
  - Get expls which key is like given search term
/quiz or !qz
  - Guess which one of the keys belongs to the given expl.
/me or !me
  - Get info of your expls and likes.
/help or !h
  - Prints this info
`);

export const reaction = {
  added: template('Added "{0}"'),
  removed: template('Removed your previous "{0}"'),
  creatorHasRemoved: constant('Expl creator has removed this expl'),
};

export const quiz = {
  notEnoughOptions: constant(
    'There needs to be atleast one more expls to create a quiz',
  ),
};

export const karma = {
  display: template('Your karma: {0}'),
};

export const me = {
  latestByYou: template('Expls made by you, starting with latest:'),
  oldestByYou: template('Expls made by you, starting with oldest:'),
  bestByYou: template('Expls made by you, most liked:'),
  worstByYou: template('Expls made by you, least liked:'),
  likedByYou: template(
    'Expls liked by you but made by others, starting with latest like:',
  ),
  empty: template('Oops, nothing to show!'),
  mostLiked: template('👍 Most liked'),
  leastLiked: template('👎 Least liked'),
  goBack: template('⬅️ Go back'),
  reviewAbove: template('Review above expls'),
  prev: template('Previous'),
  next: template('Next'),
  madeByMe: template('Made by me'),
  likedByMe: template('Liked by me'),
  whichBasis: template('On which basis would you like to browse your expls?'),
  clickToRemove: template(
    'If you click expl below, that expl will be displayed with a prompt to remove it.',
  ),
  exploreMore: template('If you want to explore more, click a button below.'),
  hello: template('Hello {0}!'),
  helloStranger: template('Hello stranger!'),
  stats: template(
    'You have added <b>{0}</b> expls, and all in all you have generated total karma of <b>{1}</b> 🎉.',
  ),
  bestSoFar: template('Your most popular expl so far has been <b>{0}</b>.'),
  removalAssurance: template(
    'Do want to remove this expl ("${key}")? This action can not be undone.',
  ),
  deletePermanently: template('Yes, delete it permanently!'),
  cancel: template('Cancel'),
  listBeginning: template('You are at beginning of the list'),
  listEnd: template('You have reached the end of the list'),
};
