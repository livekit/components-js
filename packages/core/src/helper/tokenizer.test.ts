import { describe, expect, it } from 'vitest';
import { tokenize } from './tokenizer';

describe('tokenize', () => {
  it('splits text around matches', () => {
    expect(tokenize('a foo b', { word: /foo/g })).toEqual([
      'a ',
      { type: 'word', content: 'foo' },
      ' b',
    ]);
  });

  it('drops matches nested inside an earlier, longer match', () => {
    const tokens = tokenize('abcdefghij', { outer: /abcdefghij/g, first: /cd/g, second: /gh/g });
    expect(tokens).toEqual([{ type: 'outer', content: 'abcdefghij' }]);
  });

  it('does not duplicate text when several matches overlap one match', () => {
    const input = 'xx abcdefghij yy';
    const tokens = tokenize(input, { outer: /abcdefghij/g, first: /cd/g, second: /gh/g });
    const rebuilt = tokens.map((t) => (typeof t === 'string' ? t : t.content)).join('');
    expect(rebuilt).toBe(input);
  });
});
