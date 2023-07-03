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
  processorMap: Record<string, TrackProcessor<Track.Kind>>;
}

/**
 * @alpha
 */
export function TrackProcessorSelect({
  source,
  processorMap,
  ...props
}: TrackProcessorSelectProps) {
  const room = useRoomContext();
  const { track } = useMediaTrack(source, room.localParticipant);

  const processors = Object.values(processorMap);

  const isActive = (processor: TrackProcessor<Track.Kind>) =>
    track instanceof LocalTrack && processor.name === track.getProcessor()?.name;

  const [activeProcessor, setActiveProcessor] = React.useState(processors.find(isActive));

  const handleProcessorSelect = React.useCallback(
    async (processorName: string | null) => {
      if (track instanceof LocalTrack) {
        console.log('handleProcessorSelect', processorName);
        if (processorName !== null) {
          const targetProcessor = processors.find((p) => p.name === processorName);
          if (targetProcessor) {
            await track.setProcessor(targetProcessor);
          }
          setActiveProcessor(targetProcessor);
        } else {
          await track.stopProcessor();
          setActiveProcessor(undefined);
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

  return (
    <ul {...mergedProps}>
      <li data-lk-active={!activeProcessor} aria-selected={!activeProcessor} role="option">
        <button className="lk-button" onClick={() => handleProcessorSelect(null)}>
          None
        </button>
      </li>
      {Object.entries(processorMap).map(([label, processor]) => (
        <li
          key={processor.name}
          id={processor.name}
          data-lk-active={activeProcessor === processor}
          aria-selected={activeProcessor === processor}
          role="option"
        >
          <button className="lk-button" onClick={() => handleProcessorSelect(processor.name)}>
            {label}
          </button>
        </li>
      ))}
    </ul>
  );
}
