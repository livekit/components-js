import * as React from 'react';
import { useTranscriptions, type UseTranscriptionsOptions } from './useTranscriptions';
import type { TextStreamData } from '@livekit/components-core';

/** Published per transcript segment by Expressive Mode: the segment's leading delivery tag. */
export const EXPRESSION_ATTRIBUTE = 'lk.expression';

/**
 * @beta
 * The agent's normalized emotional delivery.
 *
 * The raw label the TTS provider emits is not a fixed vocabulary: Fish Audio emits single words
 * from a closed set, Inworld emits free-form English ("soft, with genuine care"), and models
 * routinely drift outside whichever set they were given. The agent normalizes that label to this
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
 * How many agent turns an expression survives before the mood decays back to null.
 *
 * A feeling belongs to the moment that produced it. Without this, one excited sentence would leave
 * the UI excited for the rest of the session, including through turns the agent delivered flat.
 */
export const DEFAULT_MOOD_TTL_TURNS = 2;

const EXPRESSION_SETTLE_INTERVAL_MS = 150;
const EXPRESSION_SETTLE_TICKS = 20;

interface ExpressionPayload {
  mood: AgentMood | null;
  label: string | null;
}

/**
 * @beta
 * The expression published on a transcript segment, or null when it carries none.
 */
export function parseExpression(segment: TextStreamData): ExpressionPayload | null {
  const raw = segment.streamInfo.attributes?.[EXPRESSION_ATTRIBUTE];
  if (!raw) {
    return null;
  }

  try {
    const { value, mood } = JSON.parse(raw) as { value?: string; mood?: AgentMood };
    const label = value?.trim() || null;
    if (!label && !mood) {
      return null;
    }
    return { mood: mood ?? null, label };
  } catch {
    return null;
  }
}

/**
 * @beta
 */
export interface UseExpressionOptions extends UseTranscriptionsOptions {
  /**
   * Agent turns an expression survives before the mood decays to null. `0` disables decay.
   * @defaultValue 2
   */
  ttlTurns?: number;
}

/**
 * @beta
 */
export interface UseExpressionReturn {
  /** The normalized mood, or null when the agent hasn't expressed anything recently. */
  mood: AgentMood | null;
  /** The raw provider label behind the mood, verbatim and free-form. */
  label: string | null;
}

/**
 * @beta
 * useExpression returns the agent's current emotional delivery, as published by Expressive Mode.
 *
 * Reads the transcript stream the session already subscribes to, so it adds no second text stream
 * handler. The mood decays back to null after `ttlTurns` agent turns without a new expression, so
 * a feeling doesn't outlive the moment that produced it.
 *
 * @example
 * ```tsx
 * const { mood, label } = useExpression();
 * return <span title={label ?? undefined}>{mood ?? 'neutral'}</span>;
 * ```
 */
export function useExpression(opts?: UseExpressionOptions): UseExpressionReturn {
  const { ttlTurns = DEFAULT_MOOD_TTL_TURNS, ...transcriptionOpts } = opts ?? {};
  const segments = useTranscriptions(transcriptionOpts);
  const [settled, setSettled] = React.useState<string | null>(null);

  // The expression rides the stream's *closing* trailer, which livekit-client merges into the
  // streamInfo object we already hold, by mutation and without emitting. Nothing re-renders, so
  // the mood would otherwise only surface once the next segment starts: a full turn late. Poll
  // briefly after each change, and only re-render when the label actually differs.
  React.useEffect(() => {
    let ticks = 0;
    const id = setInterval(() => {
      setSettled((previous) => {
        let latest: string | null = null;
        for (const segment of segments) {
          const parsed = parseExpression(segment);
          if (parsed) {
            latest = parsed.label;
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
    let current: ExpressionPayload | null = null;
    let speaker: string | null = null;
    let turnsSince = 0;

    for (const segment of segments) {
      const parsed = parseExpression(segment);
      if (parsed) {
        current = parsed;
        speaker = segment.participantInfo.identity;
        turnsSince = 0;
      } else if (current && segment.participantInfo.identity === speaker) {
        // only the expressing participant's own later turns age the mood
        turnsSince++;
      }
    }

    if (!current || (ttlTurns > 0 && turnsSince >= ttlTurns)) {
      return { mood: null, label: null };
    }
    return current;
    // `settled` is not read here: it exists to re-run this memo once the trailer lands
  }, [segments, settled, ttlTurns]);
}
