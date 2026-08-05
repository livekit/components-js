import type { TextStreamData } from '@livekit/components-core';
import { describe, expect, it } from 'vitest';
import { EXPRESSION_ATTRIBUTE, parseExpression } from './useExpression';

function segment(attributes?: Record<string, string>): TextStreamData {
  return {
    text: 'hey',
    participantInfo: { identity: 'agent' },
    streamInfo: { attributes },
  } as unknown as TextStreamData;
}

describe('parseExpression', () => {
  it('reads the mood the agent normalized', () => {
    const parsed = parseExpression(
      segment({ [EXPRESSION_ATTRIBUTE]: '{"value":"soft, with genuine care","mood":"empathetic"}' }),
    );
    expect(parsed).toEqual({ mood: 'empathetic', label: 'soft, with genuine care' });
  });

  it('returns null when the segment carries no expression', () => {
    expect(parseExpression(segment())).toBeNull();
    expect(parseExpression(segment({ 'lk.other': 'x' }))).toBeNull();
  });

  it('survives a malformed payload', () => {
    expect(parseExpression(segment({ [EXPRESSION_ATTRIBUTE]: 'not json' }))).toBeNull();
    expect(parseExpression(segment({ [EXPRESSION_ATTRIBUTE]: '{}' }))).toBeNull();
  });

  it('keeps the label when an older agent publishes no mood', () => {
    const parsed = parseExpression(segment({ [EXPRESSION_ATTRIBUTE]: '{"value":"cheerful"}' }));
    expect(parsed).toEqual({ mood: null, label: 'cheerful' });
  });
});
