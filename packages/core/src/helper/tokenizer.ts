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
    .filter(({ index }, i, arr) => {
      if (i === 0) return true;
      const prev = arr[i - 1];
      return prev.index + prev.content.length <= index;
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
