import React, { HTMLAttributes, useEffect, useMemo, useState } from 'react';
import { ConnectionQualityInterface } from '@livekit/components-core';
import { useParticipantContext } from './Participant';
import { ConnectionQuality } from 'livekit-client';
import { mergeProps } from 'react-aria';

interface ConnectionIndicatorProps extends HTMLAttributes<HTMLDivElement> {}

/**
 * Display the connection quality of a given participant.
 */
export const ConnectionIndicator = (props: ConnectionIndicatorProps) => {
  const { className } = ConnectionQualityInterface.setup();
  const mergedProps = useMemo(() => mergeProps(props, { className }), [props, className]);
  const participant = useParticipantContext();
  const [quality, setQuality] = useState(ConnectionQuality.Unknown);

  // Get al create-observer-functions that are needed for a component.
  const { createConnectionQualityObserver } = useMemo(
    () => ConnectionQualityInterface.observers(),
    [participant],
  );

  // Create and subscribe to observers.
  useEffect(() => {
    const subscription = createConnectionQualityObserver(participant).subscribe((quality) => {
      setQuality(quality);
    });
    return () => {
      subscription.unsubscribe();
    };
  }, [participant]);

  return (
    <div {...mergedProps} className={className + ` lk-${quality}`}>
      {props.children}
    </div>
  );
};
