import * as compile from 'string-template/compile';

export const errors = {
  notFound: compile('Expl "{0}" not found.'),
  unknownError: compile('Unknown error occurred :/'),
};

export const add = {
  successful: compile('Expl created!'),
  tooLong: compile('Message has to be less than {0} characters.'),
  duplicate: compile('You already have expl with the key "{0}".'),
  invalidSyntax: compile('Try `{0} [key] [value]` or reply to any message with `{0} [key]`'),
};

export const list = {
  invalidSyntax: compile('Try `{0} [key]`'),
  notFound: compile('No expls found with key like "{0}".'),
  tooMany: compile('Found over 100 expls with key like "{0}". Try to narrow it down.'),
};

export const remove = {
  successful: compile('Expl "{0}" removed.'),
  invalidSyntax: compile('Try `{0} [key]`'),
};

export const get = {
  forbidden: compile('Expl cannot be shown since the user or the chat has blocked the bot 😢'),
  invalidSyntax: compile('Try `{0} [key]`'),
  noExpls: compile('Can\'t find any expl for you :/'),
};
