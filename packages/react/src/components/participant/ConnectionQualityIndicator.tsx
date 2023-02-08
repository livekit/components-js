import * as React from 'react';
import { setupConnectionQualityIndicator } from '@livekit/components-core';
import { useEnsureParticipant } from '../../context';
import { ConnectionQuality, Participant } from 'livekit-client';
import { mergeProps } from '../../utils';
import { getConnectionQualityIcon } from '../../assets/icons/util';
import { useObservableState } from '../../helper/useObservableState';

export interface ConnectionQualityIndicatorOpts {
  participant?: Participant;
}

export type ConnectionQualityIndicatorProps = React.HTMLAttributes<HTMLDivElement> &
  ConnectionQualityIndicatorOpts;

export function useConnectionQualityIndicator(opts?: ConnectionQualityIndicatorOpts) {
  const p = useEnsureParticipant(opts?.participant);

  const { className, connectionQualityObserver } = React.useMemo(
    () => setupConnectionQualityIndicator(p),
    [p],
  );

  const quality = useObservableState(connectionQualityObserver, ConnectionQuality.Unknown);

  return { className, quality };
}

/**
 * The ConnectionQualityIndicator shows the individual connection quality of a participant.
 *
 * @example
 * ```tsx
 * {...}
 *   <ParticipantTile>
 *     <ConnectionQualityIndicator />
 *   </ParticipantTile>
 * {...}
 * ```
 *
 * @see `ParticipantTile` component
 */
export function ConnectionQualityIndicator(props: ConnectionQualityIndicatorProps) {
  const { className, quality } = useConnectionQualityIndicator(props);
  const elementProps = React.useMemo(() => {
    return { ...mergeProps(props, { className: className as string }), 'data-lk-quality': quality };
  }, [quality, props, className]);
  return <div {...elementProps}>{props.children ?? getConnectionQualityIcon(quality)}</div>;
}
