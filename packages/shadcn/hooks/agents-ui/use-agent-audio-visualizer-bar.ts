import { useEffect, useRef, useState } from 'react';
import { type AgentState } from '@livekit/components-react';
import { usePrefersReducedMotion } from '@/hooks/agents-ui/use-prefers-reduced-motion';

function generateConnectingSequenceBar(columns: number): number[][] {
  const seq = [];

  for (let x = 0; x < columns; x++) {
    seq.push([x, columns - 1 - x]);
  }

  return seq;
}

function generateListeningSequenceBar(columns: number): number[][] {
  const center = Math.floor(columns / 2);
  const noIndex = -1;

  return [[center], [noIndex]];
}

export function useAgentAudioVisualizerBarAnimator(
  state: AgentState | undefined,
  columns: number,
  interval: number,
): number[] {
  const [index, setIndex] = useState(0);
  const [sequence, setSequence] = useState<number[][]>([[]]);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (state === 'thinking') {
      setSequence(generateListeningSequenceBar(columns));
    } else if (state === 'connecting' || state === 'initializing') {
      const sequence = [...generateConnectingSequenceBar(columns)];
      setSequence(sequence);
    } else if (state === 'listening') {
      setSequence(generateListeningSequenceBar(columns));
    } else if (state === undefined || state === 'speaking') {
      setSequence([new Array(columns).fill(0).map((_, idx) => idx)]);
    } else {
      setSequence([[]]);
    }
    setIndex(0);
  }, [state, columns]);

  const animationFrameId = useRef<number | null>(null);
  useEffect(() => {
    // With reduced motion, hold the sequence's first frame instead of stepping through it
    if (reducedMotion) {
      setIndex(0);
      return;
    }

    let startTime = performance.now();

    const animate = (time: DOMHighResTimeStamp) => {
      const timeElapsed = time - startTime;

      if (timeElapsed >= interval) {
        setIndex((prev) => prev + 1);
        startTime = time;
      }

      animationFrameId.current = requestAnimationFrame(animate);
    };

    animationFrameId.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameId.current !== null) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [interval, columns, state, sequence.length, reducedMotion]);

  return sequence[index % sequence.length] ?? [];
}
