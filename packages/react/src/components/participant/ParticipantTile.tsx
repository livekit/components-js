import * as React from 'react';
import type { Participant, TrackPublication } from 'livekit-client';
import { Track } from 'livekit-client';
import type { ParticipantClickEvent, TrackReferenceOrPlaceholder } from '@livekit/components-core';
import { isParticipantSourcePinned } from '@livekit/components-core';
import { ConnectionQualityIndicator } from './ConnectionQualityIndicator';
import { ParticipantName } from './ParticipantName';
import { TrackMutedIndicator } from './TrackMutedIndicator';
import {
  ParticipantContext,
  useEnsureParticipant,
  useMaybeLayoutContext,
  useMaybeParticipantContext,
  useMaybeTrackContext,
} from '../../context';
import { FocusToggle } from '../controls/FocusToggle';
import { ParticipantPlaceholder } from '../../assets/images';
import { ScreenShareIcon } from '../../assets/icons';
import { VideoTrack } from './VideoTrack';
import { AudioTrack } from './AudioTrack';
import { useParticipantTile } from '../../hooks';

/** @public */
export function ParticipantContextIfNeeded(
  props: React.PropsWithChildren<{
    participant?: Participant;
  }>,
) {
  const hasContext = !!useMaybeParticipantContext();
  return props.participant && !hasContext ? (
    <ParticipantContext.Provider value={props.participant}>
      {props.children}
    </ParticipantContext.Provider>
  ) : (
    <>{props.children}</>
  );
}

/** @public */
export interface ParticipantTileProps extends React.HTMLAttributes<HTMLDivElement> {
  disableSpeakingIndicator?: boolean;
  participant?: Participant;
  source?: Track.Source;
  publication?: TrackPublication;
  onParticipantClick?: (event: ParticipantClickEvent) => void;
}

/**
 * The ParticipantTile component is the base utility wrapper for displaying a visual representation of a participant.
 * This component can be used as a child of the `TrackLoop` component or by spreading a track reference as properties.
 *
 * @example
 * ```tsx
 * <ParticipantTile source={Track.Source.Camera} />
 *
 * <ParticipantTile {...trackReference} />
 * ```
 * @public
 */
export function ParticipantTile({
  participant,
  children,
  source = Track.Source.Camera,
  onParticipantClick,
  publication,
  disableSpeakingIndicator,
  ...htmlProps
}: ParticipantTileProps) {
  const p = useEnsureParticipant(participant);
  const trackRef: TrackReferenceOrPlaceholder = useMaybeTrackContext() ?? {
    participant: p,
    source,
    publication,
  };

  const { elementProps } = useParticipantTile<HTMLDivElement>({
    participant: trackRef.participant,
    htmlProps,
    source: trackRef.source,
    publication: trackRef.publication,
    disableSpeakingIndicator,
    onParticipantClick,
  });

  const layoutContext = useMaybeLayoutContext();

  const handleSubscribe = React.useCallback(
    (subscribed: boolean) => {
      if (
        trackRef.source &&
        !subscribed &&
        layoutContext &&
        layoutContext.pin.dispatch &&
        isParticipantSourcePinned(trackRef.participant, trackRef.source, layoutContext.pin.state)
      ) {
        layoutContext.pin.dispatch({ msg: 'clear_pin' });
      }
    },
    [trackRef.participant, layoutContext, trackRef.source],
  );

  return (
    <div style={{ position: 'relative' }} {...elementProps}>
      <ParticipantContextIfNeeded participant={trackRef.participant}>
        {children ?? (
          <>
            {trackRef.publication?.kind === 'video' ||
            trackRef.source === Track.Source.Camera ||
            trackRef.source === Track.Source.ScreenShare ? (
              <VideoTrack
                participant={trackRef.participant}
                source={trackRef.source}
                publication={trackRef.publication}
                onSubscriptionStatusChanged={handleSubscribe}
                manageSubscription={true}
              />
            ) : (
              <AudioTrack
                participant={trackRef.participant}
                source={trackRef.source}
                publication={trackRef.publication}
                onSubscriptionStatusChanged={handleSubscribe}
              />
            )}
            <div className="lk-participant-placeholder">
              <ParticipantPlaceholder />
            </div>
            <div className="lk-participant-metadata">
              <div className="lk-participant-metadata-item">
                {trackRef.source === Track.Source.Camera ? (
                  <>
                    <TrackMutedIndicator
                      source={Track.Source.Microphone}
                      show={'muted'}
                    ></TrackMutedIndicator>
                    <ParticipantName />
                  </>
                ) : (
                  <>
                    <ScreenShareIcon style={{ marginRight: '0.25rem' }} />
                    <ParticipantName>&apos;s screen</ParticipantName>
                  </>
                )}
              </div>
              <ConnectionQualityIndicator className="lk-participant-metadata-item" />
            </div>
          </>
        )}
        <FocusToggle trackSource={trackRef.source} />
      </ParticipantContextIfNeeded>
    </div>
  );
}
