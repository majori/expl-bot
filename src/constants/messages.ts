import * as str from 'string-template/compile';

export const errors = {
  notFound: str('Expl "{0}" not found.'),
  unknownError: str('Unknown error occurred :/'),
};

export const add = {
  successful: str('Expl created!'),
  tooLong: str('Message has to be less than {0} characters.'),
  duplicate: str('You already have expl with the key "{0}".'),
  invalidSyntax: str('Try `{0} [key] [value]` or reply to any message with `{0} [key]`'),
};

export const list = {
  invalidSyntax: str('Try `{0} [key]`'),
  notFound: str('No expls found with key like "{0}".'),
  tooMany: str('Found over 100 expls with key like "{0}". Try to narrow it down.'),
};

export const remove = {
  successful: str('Expl "{0}" removed.'),
  invalidSyntax: str('Try `{0} [key]`'),
};

export const get = {
  forbidden: str('Expl cannot be shown since the user or the chat has blocked the bot 😢'),
  invalidSyntax: str('Try `{0} [key]`'),
  noExpls: str('Can\'t find any expl for you :/'),
};

export const help = str(`
/expl or ?? \`[key]\`
  - Get a expl with the given key
/rexpl or ?!
  - Get a random expl
/add or !add \`[key]\` \`[value or reply]\`
  - Creates a expl with the given key and value. Value can be omitted if using reply to other message.
/remove or !rm \`[key]\`
  - Removes your own expl with the given key
/list or !ls \`[search term]\`
  - Get expls which key is like given search term
/help or !h
  - Prints this info
`);
