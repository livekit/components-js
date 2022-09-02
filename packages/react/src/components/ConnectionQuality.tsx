import React, { HTMLAttributes, useCallback, useEffect, useMemo, useState } from 'react';
import { setupConnectionQualityIndicator } from '@livekit/components-core';
import { useParticipantContext } from './ParticipantRenderer';
import { Participant, ConnectionQuality } from 'livekit-client';
import { mergeProps } from 'react-aria';

const useConnectionQualityIndicator = (props: HTMLAttributes<HTMLDivElement>) => {
  const participant: Participant = useParticipantContext();
  const [quality, setQuality] = useState<ConnectionQuality>(ConnectionQuality.Unknown);
  const { className, onConnectionQualityChange } = useMemo(
    () => setupConnectionQualityIndicator(),
    [],
  );

  const divProps = useMemo(() => mergeProps(props, { className }), [props, className]);

  const handleUpdate = useCallback((quality: ConnectionQuality) => {
    setQuality(quality);
  }, []);

  useEffect(() => {
    return onConnectionQualityChange(participant, handleUpdate);
  }, [participant]);

  return { divProps, quality };
};

export const ConnectionQualityIndicator = (props: HTMLAttributes<HTMLDivElement>) => {
  const { divProps, quality } = useConnectionQualityIndicator(props);
  return (
    <div {...divProps} className={divProps.className + ` lk-${quality}`}>
      {props.children}
    </div>
  );
};
