import type { TextStreamData } from '@livekit/components-core';
import { renderHook, act } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EXPRESSION_ATTRIBUTE, parseExpression, useAgentExpression } from './useAgentExpression';

const transcriptionMock = vi.hoisted(() => ({
  segments: [] as TextStreamData[],
}));

vi.mock('./useTranscriptions', () => ({
  useTranscriptions: () => transcriptionMock.segments,
}));

function segment(
  attributes?: Record<string, string>,
  identity = 'agent',
  id = 'segment-1',
): TextStreamData {
  return {
    text: 'hey',
    participantInfo: { identity },
    streamInfo: { id, attributes },
  } as unknown as TextStreamData;
}

beforeEach(() => {
  vi.useFakeTimers();
  transcriptionMock.segments = [];
});

afterEach(() => {
  vi.useRealTimers();
});

describe('parseExpression', () => {
  it('reads the mood the agent normalized', () => {
    const parsed = parseExpression(
      segment({
        [EXPRESSION_ATTRIBUTE]: '{"expression":"soft, with genuine care","mood":"empathetic"}',
      }),
    );
    expect(parsed).toEqual({ mood: 'empathetic', expression: 'soft, with genuine care' });
  });

  it('returns null when the segment carries no expression', () => {
    expect(parseExpression(segment())).toBeNull();
    expect(parseExpression(segment({ 'lk.other': 'x' }))).toBeNull();
  });

  it('survives a malformed payload', () => {
    expect(parseExpression(segment({ [EXPRESSION_ATTRIBUTE]: 'not json' }))).toBeNull();
    expect(parseExpression(segment({ [EXPRESSION_ATTRIBUTE]: '{}' }))).toBeNull();
  });

  it('keeps the wording when an agent publishes no mood', () => {
    const parsed = parseExpression(
      segment({ [EXPRESSION_ATTRIBUTE]: '{"expression":"cheerful"}' }),
    );
    expect(parsed).toEqual({ mood: null, expression: 'cheerful' });
  });

  it('normalizes blank wording to null', () => {
    const parsed = parseExpression(
      segment({ [EXPRESSION_ATTRIBUTE]: '{"expression":"   ","mood":"calm"}' }),
    );
    expect(parsed).toEqual({ mood: 'calm', expression: null });
  });
});

describe('useAgentExpression', () => {
  it('settles trailer-only updates when the wording stays the same', () => {
    const expressionSegment = segment({
      [EXPRESSION_ATTRIBUTE]: '{"expression":"steady","mood":"calm"}',
    });
    transcriptionMock.segments = [expressionSegment];

    const { result } = renderHook(() => useAgentExpression());

    expect(result.current).toEqual({ mood: 'calm', expression: 'steady' });

    expressionSegment.streamInfo.attributes = {
      [EXPRESSION_ATTRIBUTE]: '{"expression":"steady","mood":"empathetic"}',
    };

    act(() => {
      vi.advanceTimersByTime(150);
    });

    expect(result.current).toEqual({ mood: 'empathetic', expression: 'steady' });
  });
});
