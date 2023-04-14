import {
  participantInfoObserver,
  setupParticipantName,
  trackReference,
} from '@livekit/components-core';
import type { Participant } from 'livekit-client';
import { Track } from 'livekit-client';
import * as React from 'react';
import { useEnsureTrackReference } from '../../context';
import { useObservableState } from '../../hooks/internal/useObservableState';
import { mergeProps } from '../../utils';

export function useParticipantInfo(props: UseParticipantInfoOptions = {}) {
  const maybeTrackRef = props.participant
    ? trackReference(props.participant, Track.Source.Unknown)
    : undefined;
  const trackRef = useEnsureTrackReference(maybeTrackRef);
  const infoObserver = React.useMemo(
    () => participantInfoObserver(trackRef.participant),
    [trackRef.participant],
  );
  const { identity, name, metadata } = useObservableState(infoObserver, {
    name: trackRef.participant.name,
    identity: trackRef.participant.identity,
    metadata: trackRef.participant.metadata,
  });

  return { identity, name, metadata };
}

export type UseParticipantInfoOptions = {
  participant?: Participant;
};
export type ParticipantNameProps = React.HTMLAttributes<HTMLSpanElement> &
  UseParticipantInfoOptions;

/**
 * The ParticipantName component displays the name of the participant as a string within an HTML span element.
 * If no participant name is undefined the participant identity string is displayed.
 *
 * @example
 * ```tsx
 * <ParticipantName />
 * ```
 */
export function ParticipantName({ participant, ...props }: ParticipantNameProps) {
  const maybeTrackRef = participant ? trackReference(participant, Track.Source.Unknown) : undefined;
  const trackRef = useEnsureTrackReference(maybeTrackRef);

  const { className, infoObserver } = React.useMemo(() => {
    return setupParticipantName(trackRef.participant);
  }, [trackRef.participant]);

  const { identity, name } = useObservableState(infoObserver, {
    name: trackRef.participant.name,
    identity: trackRef.participant.identity,
    metadata: trackRef.participant.metadata,
  });

  const mergedProps = React.useMemo(() => {
    return mergeProps(props, { className, 'data-lk-participant-name': name });
  }, [props, className, name]);

  return (
    <span {...mergedProps}>
      {name !== '' ? name : identity}
      {props.children}
    </span>
  );
}
