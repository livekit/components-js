import * as React from 'react';
import { useTranscriptions, type UseTranscriptionsOptions } from './useTranscriptions';
import type { TextStreamData } from '@livekit/components-core';
import { ParticipantAgentAttributes } from '@livekit/components-core';

/**
 * @beta
 * Published per transcript segment by Expressive Mode: the segment's leading delivery tag.
 **/
export const EXPRESSION_ATTRIBUTE: 'lk.expression' = ParticipantAgentAttributes.Expression;

/**
 * @beta
 * The agent's normalized emotional delivery.
 *
 * The wording the TTS provider emits is not a fixed vocabulary: Fish Audio emits single words
 * from a closed set, Inworld emits free-form English ("soft, with genuine care"), and models
 * routinely drift outside whichever set they were given. The agent normalizes that wording to this
 * enum before publishing it, so every client SDK reads the same values.
 */
export type AgentMood =
  | 'excited'
  | 'happy'
  | 'playful'
  | 'curious'
  | 'surprised'
  | 'hopeful'
  | 'empathetic'
  | 'sad'
  | 'angry'
  | 'anxious'
  | 'calm';

/**
 * @beta
 * How many agent turns an expression survives before the mood decays back to null. Without decay,
 * one excited sentence would leave the UI excited for the rest of the session.
 */
export const DEFAULT_MOOD_TTL_TURNS = 2;

const EXPRESSION_SETTLE_INTERVAL_MS = 150;
const EXPRESSION_SETTLE_TICKS = 20;

function expressionSettledKey(
  segment: TextStreamData,
  segmentIndex: number,
  parsed: UseAgentExpressionReturn,
) {
  const streamId =
    segment.streamInfo.id ??
    segment.streamInfo.attributes?.[ParticipantAgentAttributes.TranscriptionSegmentId] ??
    segmentIndex;
  return `${streamId}:${segment.participantInfo.identity}:${parsed.mood ?? ''}:${
    parsed.expression ?? ''
  }`;
}

/**
 * @beta
 */
export interface UseAgentExpressionReturn {
  /** The normalized mood, or null when the agent hasn't expressed anything recently. */
  mood: AgentMood | null;
  /** The provider's own delivery wording behind the mood, verbatim and free-form. */
  expression: string | null;
}

/**
 * @beta
 * The expression published on a transcript segment, or null when it carries none.
 */
export function parseExpression(segment: TextStreamData): UseAgentExpressionReturn | null {
  const raw = segment.streamInfo.attributes?.[EXPRESSION_ATTRIBUTE];
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as { expression?: string; mood?: AgentMood };
    const expression = parsed.expression?.trim() || null;
    if (!expression && !parsed.mood) {
      return null;
    }
    return { mood: parsed.mood ?? null, expression };
  } catch {
    return null;
  }
}

/**
 * @beta
 */
export interface UseAgentExpressionOptions extends UseTranscriptionsOptions {
  /**
   * Agent turns an expression survives before the mood decays to null. `0` disables decay.
   * @defaultValue 2
   */
  ttlTurns?: number;
}

/**
 * @beta
 * useAgentExpression returns the agent's current emotional delivery, as published by Expressive Mode.
 *
 * Reads the transcript stream the session already subscribes to, so it adds no second text stream
 * handler. The mood decays back to null after `ttlTurns` agent turns without a new expression, so
 * a feeling doesn't outlive the moment that produced it.
 *
 * @example
 * ```tsx
 * const { mood, expression } = useAgentExpression();
 * return <span title={expression ?? undefined}>{mood ?? 'neutral'}</span>;
 * ```
 */
export function useAgentExpression(opts?: UseAgentExpressionOptions): UseAgentExpressionReturn {
  const { ttlTurns = DEFAULT_MOOD_TTL_TURNS, ...transcriptionOpts } = opts ?? {};
  const segments = useTranscriptions(transcriptionOpts);
  const [settled, setSettled] = React.useState<string | null>(null);

  // The expression rides the stream's *closing* trailer, which livekit-client merges into the
  // streamInfo object we already hold, by mutation and without emitting. Nothing re-renders, so
  // the mood would otherwise only surface once the next segment starts: a full turn late. Poll
  // briefly after each change, and only re-render when the expression payload actually differs.
  React.useEffect(() => {
    let ticks = 0;
    const id = setInterval(() => {
      setSettled((previous) => {
        let latest: string | null = null;
        for (let i = segments.length - 1; i >= 0; i--) {
          const parsed = parseExpression(segments[i]);
          if (parsed) {
            latest = expressionSettledKey(segments[i], i, parsed);
            break;
          }
        }
        return latest === previous ? previous : latest;
      });
      if (++ticks >= EXPRESSION_SETTLE_TICKS) {
        clearInterval(id);
      }
    }, EXPRESSION_SETTLE_INTERVAL_MS);
    return () => clearInterval(id);
  }, [segments]);

  return React.useMemo(() => {
    // Walk backward from the most recent segment: the first expression found is the current one,
    // and everything we passed on the way there (from that same speaker) ages it toward decay.
    let current: UseAgentExpressionReturn | null = null;
    let speaker: string | null = null;
    const trailingIdentities: string[] = [];

    for (let i = segments.length - 1; i >= 0; i--) {
      const segment = segments[i];
      const parsed = parseExpression(segment);
      if (parsed) {
        current = parsed;
        speaker = segment.participantInfo.identity;
        break;
      }
      // only the expressing participant's own later turns age the mood
      trailingIdentities.push(segment.participantInfo.identity);
    }

    if (!current) {
      return { mood: null, expression: null };
    }

    const turnsSince = trailingIdentities.filter((identity) => identity === speaker).length;
    if (ttlTurns > 0 && turnsSince >= ttlTurns) {
      return { mood: null, expression: null };
    }
    return current;
    // `settled` is not read here: it exists to re-run this memo once the trailer lands
  }, [segments, settled, ttlTurns]);
}
