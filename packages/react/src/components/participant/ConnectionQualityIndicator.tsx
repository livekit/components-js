import * as React from 'react';
import { setupConnectionQualityIndicator } from '@livekit/components-core';
import { useEnsureParticipant } from '../../context';
import type { Participant } from 'livekit-client';
import { ConnectionQuality } from 'livekit-client';
import { mergeProps } from '../../utils';
import { getConnectionQualityIcon } from '../../assets/icons/util';
import { useObservableState } from '../../hooks/internal/useObservableState';

/** @public */
export interface ConnectionQualityIndicatorOptions {
  participant?: Participant;
}

/** @public */
export type ConnectionQualityIndicatorProps = React.HTMLAttributes<HTMLDivElement> &
  ConnectionQualityIndicatorOptions;

/** @public */
export function useConnectionQualityIndicator(options: ConnectionQualityIndicatorOptions = {}) {
  const p = useEnsureParticipant(options.participant);

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
 * <ConnectionQualityIndicator />
 * ```
 * @public
 */
export function ConnectionQualityIndicator(props: ConnectionQualityIndicatorProps) {
  const { className, quality } = useConnectionQualityIndicator(props);
  const elementProps = React.useMemo(() => {
    return { ...mergeProps(props, { className: className as string }), 'data-lk-quality': quality };
  }, [quality, props, className]);
  return <div {...elementProps}>{props.children ?? getConnectionQualityIcon(quality)}</div>;
}
