import * as React from 'react';
import { setupConnectionQualityIndicator } from '@livekit/components-core';
import { useEnsureParticipant } from '../../contexts';
import { ConnectionQuality, Participant } from 'livekit-client';
import { mergeProps, useObservableState } from '../../utils';

export interface ConnectionQualityIndicatorProps extends React.HTMLAttributes<HTMLDivElement> {
  participant?: Participant;
}

export const useConnectionQualityIndicator = (props?: ConnectionQualityIndicatorProps) => {
  const p = useEnsureParticipant(props?.participant);

  const { className, connectionQualityObserver } = React.useMemo(
    () => setupConnectionQualityIndicator(p),
    [p],
  );

  const quality = useObservableState(connectionQualityObserver, ConnectionQuality.Unknown, [
    connectionQualityObserver,
  ]);

  const elementProps = React.useMemo(() => {
    console.log('new connection quality', quality);
    return { ...mergeProps(props, { className }), 'data-lk-quality': quality };
  }, [quality, props, className]);

  return { elementProps, quality };
};

/**
 * Indicates the connection quality of the participant.
 * This is new.
 */
export const ConnectionQualityIndicator = (props: ConnectionQualityIndicatorProps) => {
  const { elementProps } = useConnectionQualityIndicator(props);
  return <div {...elementProps}>{props.children}</div>;
};
