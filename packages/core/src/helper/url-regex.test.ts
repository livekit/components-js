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
});
