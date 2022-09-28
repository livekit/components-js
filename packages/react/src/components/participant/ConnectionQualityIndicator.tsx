import React, { HTMLAttributes, useEffect, useMemo, useState } from 'react';
import { setupConnectionQualityIndicator } from '@livekit/components-core';
import { useParticipantContext } from '../../contexts';
import { ConnectionQuality, Participant } from 'livekit-client';
import { mergeProps, useObservableState } from '../../utils';

interface ConnectionQualityIndicatorProps extends HTMLAttributes<HTMLDivElement> {
  participant?: Participant;
  'data-lk-quality': string;
}

export const useConnectionQualityIndicator = (props?: ConnectionQualityIndicatorProps) => {
  const p = props?.participant ?? useParticipantContext();

  const { className, connectionQualityObserver } = useMemo(
    () => setupConnectionQualityIndicator(p),
    [p],
  );

  const quality = useObservableState(connectionQualityObserver, ConnectionQuality.Unknown, [
    connectionQualityObserver,
  ]);

  const elementProps = useMemo(() => {
    return { ...mergeProps(props, { className }), 'data-lk-quality': quality };
  }, [quality, props, className]);

  return { elementProps, quality };
};

/**
 * Indicates the connection quality of the participant.
 */
export const ConnectionQualityIndicator = (props: ConnectionQualityIndicatorProps) => {
  const { elementProps } = useConnectionQualityIndicator(props);
  return <div {...elementProps}>{props.children}</div>;
};
