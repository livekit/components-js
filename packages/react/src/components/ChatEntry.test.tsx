import { cleanup, render } from '@testing-library/react';
import * as React from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { formatChatMessageLinks } from './ChatEntry';

describe('formatChatMessageLinks', () => {
  afterEach(() => {
    cleanup();
  });

  it.each([
    ['https://livekit.io', 'https://livekit.io/'],
    ['Https://livekit.io', 'https://livekit.io/'],
    ['HTTP://livekit.io/docs', 'http://livekit.io/docs'],
    ['livekit.io', 'https://livekit.io/'],
  ])('links %s to %s', (url, expected) => {
    const { container } = render(<>{formatChatMessageLinks(`see ${url} now`)}</>);
    const link = container.querySelector('a');
    expect(link?.textContent).toBe(url);
    expect(link?.href).toBe(expected);
  });
});
