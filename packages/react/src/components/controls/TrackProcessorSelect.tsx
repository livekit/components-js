import * as React from 'react';
import { mergeProps } from '../../utils';
import type { VideoSource, AudioSource } from '@livekit/components-core';
import { LocalTrack } from 'livekit-client';
import type { Track, TrackProcessor } from 'livekit-client';

import { useMediaTrack } from '../../hooks';
import { useRoomContext } from '../../context';

/** @alpha */
export interface TrackProcessorSelectProps extends React.HTMLAttributes<HTMLUListElement> {
  source: VideoSource | AudioSource;
  processors: TrackProcessor<Track.Kind>[];
}

/**
 * @alpha
 */
export function TrackProcessorSelect({ source, processors, ...props }: TrackProcessorSelectProps) {
  const room = useRoomContext();
  const { track } = useMediaTrack(source, room.localParticipant);

  const handleProcessorSelect = React.useCallback(
    async (processorName: string | null) => {
      if (track instanceof LocalTrack) {
        console.log('handleProcessorSelect', processorName);
        if (processorName !== null) {
          const targetProcessor = processors.find((p) => p.name === processorName);
          if (targetProcessor) {
            await track.setProcessor(targetProcessor);
          }
        } else {
          await track.stopProcessor();
        }
      }
    },
    [track, JSON.stringify(processors.map((p) => p.name))],
  );
  // Merge Props
  const mergedProps = React.useMemo(
    () => mergeProps(props, { className: 'lk-list lk-media-device-select' }),
    [props],
  );

  const isActive = (processor: TrackProcessor<Track.Kind>) =>
    track instanceof LocalTrack && processor.name === track.getProcessor()?.name;

  return (
    <ul {...mergedProps}>
      <li
        data-lk-active={!processors.some(isActive)}
        aria-selected={!processors.some(isActive)}
        role="option"
      >
        <button className="lk-button" onClick={() => handleProcessorSelect(null)}>
          None
        </button>
      </li>
      {processors.map((processor) => (
        <li
          key={processor.name}
          id={processor.name}
          data-lk-active={isActive(processor)}
          aria-selected={isActive(processor)}
          role="option"
        >
          <button className="lk-button" onClick={() => handleProcessorSelect(processor.name)}>
            {processor.name}
          </button>
        </li>
      ))}
    </ul>
  );
}
