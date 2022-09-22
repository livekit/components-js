import React, { HTMLAttributes, useEffect, useMemo, useState } from 'react';
import { setupConnectionQualityIndicator } from '@livekit/components-core';
import { useParticipantContext } from '../../contexts';
import { ConnectionQuality, Participant } from 'livekit-client';
import { mergeProps } from '../../utils';

interface ConnectionQualityIndicatorProps extends HTMLAttributes<HTMLDivElement> {
  participant?: Participant;
}

export const useConnectionQualityIndicator = (props?: ConnectionQualityIndicatorProps) => {
  const p = props?.participant ?? useParticipantContext();
  const [quality, setQuality] = useState(ConnectionQuality.Unknown);

  const { className, connectionQualityObserver } = useMemo(
    () => setupConnectionQualityIndicator(p),
    [p],
  );

  useEffect(() => {
    const subscription = connectionQualityObserver.subscribe(({ quality }) => {
      setQuality(quality);
    });
    return () => {
      subscription.unsubscribe();
    };
  }, [connectionQualityObserver]);

  const elementProps = useMemo(
    () => mergeProps(props, { className }, { className: quality }),
    [quality, props, className],
  );

  return { elementProps, quality };
};

/**
 * Indicates the connection quality of the participant.
 */
export const ConnectionQualityIndicator = (props: ConnectionQualityIndicatorProps) => {
  const { elementProps } = useConnectionQualityIndicator(props);
  return <div {...elementProps}>{props.children}</div>;
};
