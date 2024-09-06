import { useEffect, useRef, useState } from 'react';
import { generateConnectingSequenceBar } from '../animationSequences/connectingSequence';
import { generateListeningSequenceBar } from '../animationSequences/listeningSequence';
import { generateThinkingSequenceBar } from '../animationSequences/thinkingSequence';
import type { VoiceAssistantState } from '../../../hooks';

export const useBarAnimator = (
  type: VoiceAssistantState,
  columns: number,
  interval: number,
): number[] => {
  const [index, setIndex] = useState(0);
  const [sequence, setSequence] = useState<number[][]>([[]]);

  useEffect(() => {
    if (type === 'thinking') {
      setSequence(generateThinkingSequenceBar(columns));
    } else if (type === 'connecting') {
      const sequence = [...generateConnectingSequenceBar(columns)];
      setSequence(sequence);
    } else if (type === 'listening') {
      setSequence(generateListeningSequenceBar(columns));
    } else {
      setSequence([[]]);
    }
    setIndex(0);
  }, [type, columns]);

  const animationFrameId = useRef<number | null>(null);
  useEffect(() => {
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
  }, [interval, columns, type, sequence.length]);

  return sequence[index % sequence.length];
};
