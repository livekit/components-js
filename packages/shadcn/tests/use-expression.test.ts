import { describe, it, expect, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import type { TextStreamData } from '@livekit/components-react';
import {
  DEFAULT_MOOD,
  EXPRESSION_ATTRIBUTE,
  matchMood,
  parseExpressionLabel,
  useExpression,
} from '@/hooks/agents-ui/use-expression';
import { DEFAULT_PRIMARY_COLOR, MOOD_COLORS, mixColors, moodColor } from '@/lib/mood-color';

const messages = vi.hoisted(() => ({ current: [] as TextStreamData[] }));

vi.mock('@livekit/components-react', () => ({
  useTranscriptions: () => messages.current,
}));

function agentMessage(id: string, expression?: string): TextStreamData {
  return {
    text: 'hello',
    participantInfo: { identity: 'agent' },
    streamInfo: {
      id,
      timestamp: 0,
      attributes: expression
        ? { [EXPRESSION_ATTRIBUTE]: JSON.stringify({ value: expression }) }
        : {},
    },
  } as TextStreamData;
}

function userMessage(id: string): TextStreamData {
  return {
    text: 'hi',
    participantInfo: { identity: 'user' },
    streamInfo: { id, timestamp: 0, attributes: {} },
  } as TextStreamData;
}

const MOODS = Object.keys(MOOD_COLORS) as (keyof typeof MOOD_COLORS)[];

describe('matchMood', () => {
  // real labels, captured by running the expressive_agent example against each provider
  describe.each([
    [
      'fishaudio',
      {
        excited: 'excited',
        happy: 'happy',
        curious: 'curious',
        empathetic: 'empathetic',
        sad: 'sad',
        sarcastic: 'playful',
        regretful: 'sad',
        hopeful: 'hopeful',
        surprised: 'surprised',
      },
    ],
    [
      'cartesia',
      {
        excited: 'excited',
        sympathetic: 'empathetic',
        frustrated: 'angry',
        angry: 'angry',
        'joking/comedic': 'playful',
        amazed: 'surprised',
        contemplative: 'calm',
        confident: 'hopeful',
        content: 'happy',
        calm: 'calm',
        neutral: 'calm',
        scared: 'anxious',
        elated: 'excited',
      },
    ],
    [
      'inworld',
      {
        'bright, upbeat energy': 'excited',
        'warm and curious': 'curious',
        'sincere and concerned': 'empathetic',
        'soft, with genuine care': 'empathetic',
        'gentle and steady': 'empathetic',
        'say playfully': 'playful',
        'delighted and warm': 'happy',
        'bright and inviting': 'excited',
        'warm and grounded': 'happy',
        'gently curious, welcoming': 'curious',
        'easygoing and reassuring': 'calm',
        'speak with warm surprise': 'surprised',
        'sound concerned': 'empathetic',
      },
    ],
  ])('%s labels', (_provider, corpus) => {
    it.each(Object.entries(corpus))('matches %j to %s', (label, expected) => {
      expect(matchMood(label)).toBe(expected);
    });
  });

  it('is case insensitive', () => {
    expect(matchMood('SOFT, WITH GENUINE CARE')).toBe('empathetic');
  });

  it('matches word stems, so surprise/surprised/surprising all land', () => {
    for (const label of ['surprise', 'surprised', 'surprising']) {
      expect(matchMood(label)).toBe('surprised');
    }
  });

  it('lets an explicitly named mood beat a supporting descriptor in the same label', () => {
    expect(matchMood('gently curious, welcoming')).toBe('curious');
  });

  it('falls back rather than guessing on an unrecognized label', () => {
    expect(matchMood('like a pirate')).toBe(DEFAULT_MOOD);
    expect(matchMood('')).toBe(DEFAULT_MOOD);
  });

  it('honours an explicit fallback, including null', () => {
    expect(matchMood('like a pirate', { fallback: 'happy' })).toBe('happy');
    expect(matchMood('like a pirate', { fallback: null })).toBeNull();
  });

  it('accepts extra keywords without forking the table', () => {
    expect(matchMood('feeling swashbuckling')).toBe(DEFAULT_MOOD);
    expect(
      matchMood('feeling swashbuckling', { extraKeywords: { playful: { swashbuckling: 2 } } }),
    ).toBe('playful');
  });

  it('lets extra keywords outweigh a built-in match', () => {
    expect(matchMood('quietly confident', { extraKeywords: { hopeful: { confident: 3 } } })).toBe(
      'hopeful',
    );
  });
});

describe('parseExpressionLabel', () => {
  it('reads the value out of the JSON attribute', () => {
    expect(parseExpressionLabel(agentMessage('1', 'excited'))).toBe('excited');
  });

  it('returns null when the message carries no expression', () => {
    expect(parseExpressionLabel(agentMessage('1'))).toBeNull();
  });

  it('returns null on malformed JSON rather than throwing', () => {
    const bad = {
      text: '',
      participantInfo: { identity: 'agent' },
      streamInfo: { id: '1', timestamp: 0, attributes: { [EXPRESSION_ATTRIBUTE]: '{not json' } },
    } as unknown as TextStreamData;
    expect(parseExpressionLabel(bad)).toBeNull();
  });

  it('returns null for an empty or whitespace value', () => {
    expect(parseExpressionLabel(agentMessage('1', '   '))).toBeNull();
  });
});

describe('useExpression', () => {
  it('is null before the agent has published any expression', () => {
    messages.current = [agentMessage('1')];
    const { result } = renderHook(() => useExpression());
    expect(result.current).toEqual({ label: null, mood: null, color: DEFAULT_PRIMARY_COLOR });
  });

  it('exposes the raw label alongside the matched mood', () => {
    messages.current = [agentMessage('1', 'soft, with genuine care')];
    const { result } = renderHook(() => useExpression());
    expect(result.current).toMatchObject({ label: 'soft, with genuine care', mood: 'empathetic' });
  });

  it('takes the latest expression, ignoring later segments that carry none', () => {
    messages.current = [
      agentMessage('1', 'excited'),
      agentMessage('2', 'sincere and concerned'),
      agentMessage('3'),
    ];
    const { result } = renderHook(() => useExpression());
    expect(result.current.mood).toBe('empathetic');
  });

  it('falls back on an unmatched label but still reports it verbatim', () => {
    messages.current = [agentMessage('1', 'like a pirate')];
    const { result } = renderHook(() => useExpression());
    expect(result.current).toMatchObject({ label: 'like a pirate', mood: DEFAULT_MOOD });
  });

  it('threads fallback and extraKeywords through to the matcher', () => {
    messages.current = [agentMessage('1', 'feeling swashbuckling')];
    const { result } = renderHook(() =>
      useExpression({ extraKeywords: { playful: { swashbuckling: 2 } } }),
    );
    expect(result.current.mood).toBe('playful');

    const { result: nulled } = renderHook(() => useExpression({ fallback: null }));
    expect(nulled.current.mood).toBeNull();
  });
});

describe('mixColors', () => {
  it('returns the endpoints at 0 and 1', () => {
    expect(mixColors('#000000', '#ffffff', 0)).toBe('#000000');
    expect(mixColors('#000000', '#ffffff', 1)).toBe('#FFFFFF');
  });

  it('blends halfway', () => {
    expect(mixColors('#000000', '#ffffff', 0.5)).toBe('#808080');
  });

  it('clamps out-of-range amounts', () => {
    expect(mixColors('#000000', '#ffffff', -1)).toBe('#000000');
    expect(mixColors('#000000', '#ffffff', 2)).toBe('#FFFFFF');
  });
});

describe('moodColor', () => {
  it('returns the primary untouched when there is no mood', () => {
    expect(moodColor(null)).toBe(DEFAULT_PRIMARY_COLOR);
    expect(moodColor(null, { primary: '#7C4DFF' })).toBe('#7C4DFF');
  });

  it('keeps the primary at blend 0 and takes the accent at blend 1', () => {
    expect(moodColor('angry', { primary: '#7C4DFF', blend: 0 })).toBe('#7C4DFF');
    expect(moodColor('angry', { primary: '#7C4DFF', blend: 1 })).toBe(MOOD_COLORS.angry);
  });

  it('lands between primary and accent at a partial blend', () => {
    const blended = moodColor('angry', { primary: '#000000', blend: 0.5 });
    expect(blended).not.toBe('#000000');
    expect(blended).not.toBe(MOOD_COLORS.angry);
    expect(blended).toBe(mixColors('#000000', MOOD_COLORS.angry, 0.5));
  });

  it('honours a per-mood accent override', () => {
    expect(moodColor('sad', { blend: 1, moodColors: { sad: '#123456' } })).toBe('#123456');
  });

  it('gives every mood a distinct color at full blend', () => {
    const colors = Object.keys(MOOD_COLORS).map((m) =>
      moodColor(m as keyof typeof MOOD_COLORS, { blend: 1 }),
    );
    expect(new Set(colors).size).toBe(colors.length);
  });
});

describe('useExpression render cost', () => {
  it('adds no renders of its own, since it holds no animation state', () => {
    let renders = 0;
    messages.current = [agentMessage('1', 'calm')];
    const { rerender } = renderHook(() => {
      renders++;
      return useExpression();
    });

    messages.current = [agentMessage('1', 'grief-stricken')];
    act(() => {
      rerender();
    });

    expect(renders).toBe(2);
  });
});

describe('mood colors', () => {
  it('returns the primary untouched when there is no mood', () => {
    expect(moodColor(null)).toBe(DEFAULT_PRIMARY_COLOR);
    expect(moodColor(null, { primary: '#7C4DFF' })).toBe('#7C4DFF');
  });

  it('keeps the primary at blend 0 and takes the accent at blend 1', () => {
    expect(moodColor('angry', { primary: '#7C4DFF', blend: 0 })).toBe('#7C4DFF');
    expect(moodColor('angry', { primary: '#7C4DFF', blend: 1 })).toBe(MOOD_COLORS.angry);
  });

  it('honours a per-mood accent override', () => {
    expect(moodColor('sad', { blend: 1, moodColors: { sad: '#123456' } })).toBe('#123456');
  });

  it('gives every mood a distinct color at full blend', () => {
    const colors = MOODS.map((m) => moodColor(m, { blend: 1 }));
    expect(new Set(colors).size).toBe(colors.length);
  });

  it('mixColors blends and clamps', () => {
    expect(mixColors('#000000', '#ffffff', 0)).toBe('#000000');
    expect(mixColors('#000000', '#ffffff', 0.5)).toBe('#808080');
    expect(mixColors('#000000', '#ffffff', 2)).toBe('#FFFFFF');
  });
});

describe('useExpression color', () => {
  it('is the default primary before the agent has expressed anything', () => {
    messages.current = [agentMessage('1')];
    const { result } = renderHook(() => useExpression());
    expect(result.current.color).toBe(DEFAULT_PRIMARY_COLOR);
  });

  it('colors the matched mood from the default palette', () => {
    messages.current = [agentMessage('1', 'furious')];
    const { result } = renderHook(() => useExpression());
    expect(result.current.mood).toBe('angry');
    expect(result.current.color).toBe(moodColor('angry'));
  });

  it('leaves customization to moodColor', () => {
    expect(moodColor('angry', { primary: '#7C4DFF', blend: 1 })).toBe(MOOD_COLORS.angry);
  });
});

describe('mood decay', () => {
  it('keeps the mood while the agent keeps expressing', () => {
    messages.current = [agentMessage('1', 'furious'), agentMessage('2', 'thrilled')];
    const { result } = renderHook(() => useExpression());
    expect(result.current.mood).toBe('excited');
  });

  it('decays to neutral after the TTL of silent agent turns', () => {
    messages.current = [agentMessage('1', 'furious'), agentMessage('2'), agentMessage('3')];
    const { result } = renderHook(() => useExpression({ ttlTurns: 2 }));
    expect(result.current).toEqual({ mood: null, label: null, color: DEFAULT_PRIMARY_COLOR });
  });

  it('still holds the mood one turn before the TTL', () => {
    messages.current = [agentMessage('1', 'furious'), agentMessage('2')];
    const { result } = renderHook(() => useExpression({ ttlTurns: 2 }));
    expect(result.current.mood).toBe('angry');
  });

  it('user turns do not age the mood', () => {
    messages.current = [
      agentMessage('1', 'furious'),
      userMessage('2'),
      userMessage('3'),
      userMessage('4'),
    ];
    const { result } = renderHook(() => useExpression({ ttlTurns: 2 }));
    expect(result.current.mood).toBe('angry');
  });

  it('ttlTurns 0 disables decay', () => {
    messages.current = [
      agentMessage('1', 'furious'),
      agentMessage('2'),
      agentMessage('3'),
      agentMessage('4'),
    ];
    const { result } = renderHook(() => useExpression({ ttlTurns: 0 }));
    expect(result.current.mood).toBe('angry');
  });
});
