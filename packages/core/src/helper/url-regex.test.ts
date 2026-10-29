import { describe, test, expect } from 'vitest';
import { createUrlRegExp } from './url-regex';

describe('url-regex', () => {
  test('should match urls', () => {
    // Valid URLs
    expect(createUrlRegExp({}).test('http://www.livekit.com')).toBe(true);
    expect(createUrlRegExp({}).test('www.livekit.com')).toBe(true);
    expect(createUrlRegExp({}).test('livekit.com')).toBe(true);
    // Invalid URLs
    expect(createUrlRegExp({}).test('livekitcom')).toBe(false);
  });

  test.each([
    ['Docs: https://docs.livekit.io/agents.', 'https://docs.livekit.io/agents'],
    ['Go to https://livekit.io/a, then b', 'https://livekit.io/a'],
    ['Is it https://livekit.io/x?', 'https://livekit.io/x'],
    ['Have you tried livekit.io?', 'livekit.io'],
    ['Docs are at https://docs.livekit.io.', 'https://docs.livekit.io'],
    ['see (https://livekit.io/pricing) ok', 'https://livekit.io/pricing'],
    [
      'https://en.wikipedia.org/wiki/Python_(language)',
      'https://en.wikipedia.org/wiki/Python_(language)',
    ],
    ['https://livekit.io/search?q=a&b=c#top', 'https://livekit.io/search?q=a&b=c#top'],
  ])('leaves trailing punctuation out of the url in %s', (input, url) => {
    expect(input.match(createUrlRegExp({}))).toEqual([url]);
  });
});
