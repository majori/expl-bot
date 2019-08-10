// tslint:disable max-line-length
import * as template from 'string-template/compile';
import { constant } from 'lodash';

export const errors = {
  notFound: template('Expl "{0}" not found.'),
  unknownError: constant('Unknown error occurred :/'),
};

export const add = {
  successful: constant('Expl created!'),
  successfulWithDisclaimer: template('Expl "{0}" created! (If you wanna use multiple words in a key, use _ between words)'),
  tooLong: template('Message has to be less than {0} characters.'),
  duplicate: template('You already have expl with the key "{0}".'),
  invalidSyntax: template('Try `{0} [key] [value]` or reply to any message with `{0} [key]`'),
};

export const list = {
  invalidSyntax: template('Try `{0} [key]`'),
  notFound: template('No expls found with key like "{0}".'),
  tooMany: template('Found over 100 expls with key like "{0}". Try to narrow it down.'),
};

export const remove = {
  successful: template('Expl "{0}" removed.'),
  invalidSyntax: template('Try `{0} [key]`'),
};

export const get = {
  forbidden: constant('Expl cannot be shown since the user or the chat has blocked the bot 😢'),
  invalidSyntax: template('Try `{0} [key]`'),
  noExpls: constant('Can\'t find any expl for you :/'),
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
/help or !h
  - Prints this info
`);

export const reaction = {
  added: template('Added "{0}"'),
  removed: template('Removed your previous "{0}"'),
  creatorHasRemoved: constant('Expl creator has removed this expl'),
};
