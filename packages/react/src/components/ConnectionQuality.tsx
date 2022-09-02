import React, { HTMLAttributes, useEffect, useMemo, useState } from 'react';
import { setupConnectionQualityIndicator } from '@livekit/components-core';
import { useParticipantContext } from './Participant';
import { ConnectionQuality } from 'livekit-client';
import { mergeProps } from 'react-aria';

interface ConnectionIndicatorProps extends HTMLAttributes<HTMLDivElement> {}

const useConnectionIndicator = (props: ConnectionIndicatorProps) => {
  const participant = useParticipantContext();
  const [quality, setQuality] = useState(ConnectionQuality.Unknown);
  const { className, onConnectionQualityChange } = useMemo(
    () => setupConnectionQualityIndicator(),
    [],
  );

  const divProps = useMemo(() => mergeProps(props, { className }), [props, className]);

  useEffect(() => {
    return onConnectionQualityChange(participant, (quality) => setQuality(quality));
  }, [participant]);

  return { divProps, quality };
};

/**
 * Display the connection quality of a given participant.
 */
export const ConnectionQualityIndicator = (props: HTMLAttributes<HTMLDivElement>) => {
  const { divProps, quality } = useConnectionIndicator(props);
  return (
    <div {...divProps} className={divProps.className + ` lk-${quality}`}>
      {props.children}
    </div>
  );
};
