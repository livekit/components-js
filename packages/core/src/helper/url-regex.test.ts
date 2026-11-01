import { describe, test, expect } from 'vitest';
import { createUrlRegExp } from './url-regex';

describe('url-regex', () => {
  test('should match urls', () => {
    // Valid URLs
    expect(createUrlRegExp({}).test('http://www.livekit.com')).toBe(true);
    expect(createUrlRegExp({}).test('www.livekit.com')).toBe(true);
    expect(createUrlRegExp({}).test('livekit.com')).toBe(true);
    expect('https://en.wikipedia.org/wiki/Python_(language)'.match(createUrlRegExp({}))).toEqual([
      'https://en.wikipedia.org/wiki/Python_(language)',
    ]);
    expect('https://livekit.io/search?q=a&b=c#top'.match(createUrlRegExp({}))).toEqual([
      'https://livekit.io/search?q=a&b=c#top',
    ]);
    // Trailing punctuation is left out of the url
    expect('Docs: https://docs.livekit.io/agents.'.match(createUrlRegExp({}))).toEqual([
      'https://docs.livekit.io/agents',
    ]);
    expect('Go to https://livekit.io/a, then b'.match(createUrlRegExp({}))).toEqual([
      'https://livekit.io/a',
    ]);
    expect('Is it https://livekit.io/x?'.match(createUrlRegExp({}))).toEqual([
      'https://livekit.io/x',
    ]);
    expect('Have you tried livekit.io?'.match(createUrlRegExp({}))).toEqual(['livekit.io']);
    expect('Docs are at https://docs.livekit.io.'.match(createUrlRegExp({}))).toEqual([
      'https://docs.livekit.io',
    ]);
    expect('see (https://livekit.io/pricing) ok'.match(createUrlRegExp({}))).toEqual([
      'https://livekit.io/pricing',
    ]);
    // Invalid URLs
    expect(createUrlRegExp({}).test('livekitcom')).toBe(false);
  });
});
