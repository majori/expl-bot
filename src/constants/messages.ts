// tslint:disable max-line-length
import * as template from 'string-template/compile';
import { constant } from 'lodash';

type MessageFunc = (...array: any[]) => string;
type MessageMap = { [name: string]: MessageFunc };

export const errors: MessageMap = {
  notFound: template('Expl "{0}" not found.'),
  unknownError: constant('Unknown error occurred :/'),
};

export const add: MessageMap = {
  successful: template('Expl "{0}" created!'),
  successfulWithDisclaimer: template(
    'Expl "{0}" created! (If you want to use multiple words in a key, use _ between words)',
  ),
  tooLong: template('Message has to be less than {0} characters.'),
  duplicate: template('You already have expl with the key "{0}".'),
  invalidSyntax: template(
    'Try `{0} [key] [value]` or reply to any message with `{0} [key]`',
  ),
  isBot: constant('Can not add content from other bots!'),
};

export const list: MessageMap = {
  invalidSyntax: template('Try `{0} [key]`'),
  notFound: template('No expls found with key like "{0}".'),
  tooMany: template(
    'Found over 100 expls with key like "{0}". Try to narrow it down.',
  ),
};

export const remove: MessageMap = {
  successful: template('Expl "{0}" removed.'),
  invalidSyntax: template('Try `{0} [key]`'),
};

export const get: MessageMap = {
  forbidden: constant(
    'Expl cannot be shown since the user or the chat has blocked the bot 😢',
  ),
  invalidSyntax: template('Try `{0} [key]`'),
  noExpls: constant("Can't find any expl for you :/"),
};

export const resolve: MessageMap = {
  notExpl: constant('Replied message was not an expl'),
  noReply: constant('Reply to an expl to find out its key'),
};

export const help: MessageFunc = constant(`
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
/viral or !vrl
  - Get most viral expls.
/help or !h
  - Prints this info
`);

export const reaction: MessageMap = {
  added: template('Added "{0}"'),
  removed: template('Removed your previous "{0}"'),
  creatorHasRemoved: constant('Expl creator has removed this expl'),
  confirmRemoval: constant('❗️ already added, click again to remove'),
};

export const quiz: MessageMap = {
  notEnoughOptions: constant(
    'There needs to be atleast one more expls to create a quiz',
  ),
};

export const me: MessageMap = {
  latestByYou: constant('Expls made by you, starting with latest:'),
  oldestByYou: constant('Expls made by you, starting with oldest:'),
  bestByYou: constant('Expls made by you, most liked:'),
  worstByYou: constant('Expls made by you, least liked:'),
  likedByYou: constant(
    'Expls liked by you but made by others, starting with latest like:',
  ),
  empty: constant('Oops, nothing to show!'),
  mostLiked: constant('👍 Most liked'),
  leastLiked: constant('👎 Least liked'),
  goBack: constant('⬅️ Go back'),
  reviewAbove: constant('Review above expls'),
  prev: constant('Previous'),
  next: constant('Next'),
  madeByMe: constant('Made by me'),
  likedByMe: constant('Liked by me'),
  whichBasis: constant('On which basis would you like to browse your expls?'),
  clickToRemove: constant(
    'If you click expl below, that expl will be displayed with a prompt to remove it.',
  ),
  exploreMore: constant('If you want to explore more, click a button below.'),
  hello: template('Hello {0}\\!'),
  helloStranger: constant('Hello stranger\\!'),
  stats: template(
    'You have added *{0}* expls, and all in all you have generated total karma of *{1}* 🎉\\.',
  ),
  bestSoFar: template('Your most popular expl so far has been *{0}*\\.'),
  quizAnswers: template(
    'You have answered *{0}* quizzes, with success rate of *{1}*% 👏\\.',
  ),
  removalAssurance: template(
    'Do want to remove this expl ("{0}")? This action can not be undone.',
  ),
  deletePermanently: constant('Yes, delete it permanently!'),
  cancel: constant('Cancel'),
  listBeginning: constant('You are at beginning of the list'),
  listEnd: constant('You have reached the end of the list'),
};

export const viral: MessageMap = {
  notEnoughData: constant('Not enough data.'),
  lead: constant('The hottest expls right now 🔥:'),
  leadPrivate: constant('The hottest expls from all over your chats:'),
};
