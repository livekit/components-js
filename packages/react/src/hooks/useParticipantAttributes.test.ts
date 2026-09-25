import { ParticipantInfo } from '@livekit/protocol';
import { act, renderHook } from '@testing-library/react';
import { Participant, ParticipantEvent } from 'livekit-client';
import { describe, expect, test } from 'vitest';
import { useParticipantAttribute } from './useParticipantAttributes';

function updateAttributes(participant: Participant, attributes: Record<string, string>) {
  act(() => {
    participant.updateInfo(
      new ParticipantInfo({ sid: participant.sid, identity: participant.identity, attributes }),
    );
  });
}

describe('useParticipantAttribute', () => {
  test('clears the previous value when the next participant has no matching attribute', () => {
    const first = new Participant('PA_first', 'first', undefined, undefined, { role: 'host' });
    const second = new Participant('PA_second', 'second');
    const { result, rerender, unmount } = renderHook(
      ({ participant }) => useParticipantAttribute('role', { participant }),
      { initialProps: { participant: first } },
    );
    expect(result.current).toBe('host');

    rerender({ participant: second });
    expect(result.current).toBeUndefined();
    expect(first.listenerCount(ParticipantEvent.AttributesChanged)).toBe(0);

    updateAttributes(first, { role: 'moderator' });
    expect(result.current).toBeUndefined();
    updateAttributes(second, { role: 'guest' });
    expect(result.current).toBe('guest');
    updateAttributes(second, {});
    expect(result.current).toBeUndefined();

    unmount();
    expect(second.listenerCount(ParticipantEvent.AttributesChanged)).toBe(0);
  });

  test('clears the previous value when switching to an absent key on the same participant', () => {
    const participant = new Participant('PA_first', 'first', undefined, undefined, {
      role: 'host',
    });
    const { result, rerender, unmount } = renderHook(
      ({ attributeKey }) => useParticipantAttribute(attributeKey, { participant }),
      { initialProps: { attributeKey: 'role' } },
    );
    expect(result.current).toBe('host');

    rerender({ attributeKey: 'language' });
    expect(result.current).toBeUndefined();
    updateAttributes(participant, { role: 'moderator' });
    expect(result.current).toBeUndefined();
    updateAttributes(participant, { role: 'moderator', language: 'en' });
    expect(result.current).toBe('en');

    rerender({ attributeKey: 'role' });
    expect(result.current).toBe('moderator');
    unmount();
    expect(participant.listenerCount(ParticipantEvent.AttributesChanged)).toBe(0);
  });
});
