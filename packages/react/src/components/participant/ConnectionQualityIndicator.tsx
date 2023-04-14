import * as React from 'react';
import { setupConnectionQualityIndicator, trackReference } from '@livekit/components-core';
import { useEnsureTrackReference } from '../../context';
import { Track } from 'livekit-client';
import type { Participant } from 'livekit-client';
import { ConnectionQuality } from 'livekit-client';
import { mergeProps } from '../../utils';
import { getConnectionQualityIcon } from '../../assets/icons/util';
import { useObservableState } from '../../hooks/internal/useObservableState';

export interface ConnectionQualityIndicatorOptions {
  participant?: Participant;
}

export type ConnectionQualityIndicatorProps = React.HTMLAttributes<HTMLDivElement> &
  ConnectionQualityIndicatorOptions;

export function useConnectionQualityIndicator(options: ConnectionQualityIndicatorOptions = {}) {
  const maybeTrackRef = options.participant
    ? trackReference(options.participant, Track.Source.Unknown)
    : undefined;
  const { participant } = useEnsureTrackReference(maybeTrackRef);

  const { className, connectionQualityObserver } = React.useMemo(
    () => setupConnectionQualityIndicator(participant),
    [participant],
  );

  const quality = useObservableState(connectionQualityObserver, ConnectionQuality.Unknown);

  return { className, quality };
}

/**
 * The ConnectionQualityIndicator shows the individual connection quality of a participant.
 *
 * @example
 * ```tsx
 * <ConnectionQualityIndicator />
 * ```
 */
export function ConnectionQualityIndicator(props: ConnectionQualityIndicatorProps) {
  const { className, quality } = useConnectionQualityIndicator(props);
  const elementProps = React.useMemo(() => {
    return { ...mergeProps(props, { className: className as string }), 'data-lk-quality': quality };
  }, [quality, props, className]);
  return <div {...elementProps}>{props.children ?? getConnectionQualityIcon(quality)}</div>;
}
