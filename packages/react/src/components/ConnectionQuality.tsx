import React, { HTMLAttributes, useCallback, useEffect, useState } from 'react';
import { setupConnectionQualityIndicator } from '@livekit/components-core';
import { useParticipantContext } from './ParticipantRenderer';
import { Participant, ConnectionQuality } from 'livekit-client';
import { mergeProps } from 'react-aria';

const useConnectionQualityIndicator = (props: HTMLAttributes<HTMLDivElement>) => {
  const participant: Participant = useParticipantContext();
  const [quality, setQuality] = useState<ConnectionQuality>(ConnectionQuality.Unknown);
  const { className, onConnectionQualityChange } = setupConnectionQualityIndicator();
  const mergedProps = mergeProps(props, { className });

  const handleUpdate = useCallback((quality: ConnectionQuality) => {
    setQuality(quality);
  }, []);

  useEffect(() => {
    return onConnectionQualityChange(participant, handleUpdate);
  }, [participant]);

  return { divProps: mergedProps, quality };
};

export const ConnectionQualityIndicator = (props: HTMLAttributes<HTMLDivElement>) => {
  const { divProps, quality } = useConnectionQualityIndicator(props);
  return (
    <div {...divProps}>
      {`Q:${quality.valueOf()}`}
      {/* <div className="lk-signal-bar"></div>
      <div className="lk-signal-bar"></div>
      <div className="lk-signal-bar"></div> */}
    </div>
  );
};
