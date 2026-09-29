import { createEmailRegExp } from './emailRegex';
import { createUrlRegExp } from './url-regex';

export type TokenizeGrammar = { [type: string]: RegExp };

export const createDefaultGrammar = () => {
  return {
    email: createEmailRegExp(),
    url: createUrlRegExp({}),
  } satisfies TokenizeGrammar;
};

export function tokenize<T extends TokenizeGrammar>(input: string, grammar: T) {
  let lastEnd = 0;
  const matches = Object.entries(grammar)
    .map(([type, rx], weight) =>
      Array.from(input.matchAll(rx)).map(({ index, 0: content }) => ({
        type: type as keyof T,
        weight,
        content,
        index: index ?? 0,
      })),
    )
    .flat()
    .sort((a, b) => {
      const d = a.index - b.index;
      return d !== 0 ? d : a.weight - b.weight;
    })
    .filter(({ index, content }) => {
      // Keep a match only if it starts after the end of the last kept match.
      if (index < lastEnd) return false;
      lastEnd = index + content.length;
      return true;
    });

  const tokens = [];
  let pos = 0;
  for (const { type, content, index } of matches) {
    if (index > pos) tokens.push(input.substring(pos, index));
    tokens.push({ type, content });
    pos = index + content.length;
  }
  if (input.length > pos) tokens.push(input.substring(pos));
  return tokens;
}
