import { Participant, Track } from 'livekit-client';
import * as React from 'react';
import { useMaybePinContext, usePinContext } from '../contexts';
import { mergeProps } from '../utils';
import { MediaTrack } from '../components/participant/MediaTrack';
import { ParticipantClickEvent } from '../components/participant/ParticipantView';
import { ClearPinButton } from '../components/ClearPinButton';
import { TrackLoop } from '../components/TrackLoop';
import { TrackParticipantPair } from '@livekit/components-core';

export interface FocusLayoutContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  focusParticipant?: Participant;
  focusTrackSource?: Track.Source;
  participants?: Array<Participant>;
  onParticipantClick?: (evt: ParticipantClickEvent) => void;
}

export function FocusLayoutContainer({
  focusParticipant,
  focusTrackSource,
  onParticipantClick,
  ...props
}: FocusLayoutContainerProps) {
  const elementProps = mergeProps(props, { className: 'lk-focus-layout' });
  const pinContext = usePinContext();

  return (
    <>
      <div {...elementProps}>
        {props.children ?? (
          <>
            {pinContext?.state?.length && (
              <FocusLayout trackParticipantPair={pinContext.state[0]} />
            )}
            <CarouselView>
              <TrackLoop
                sources={[Track.Source.Camera, Track.Source.ScreenShare]}
                excludePinnedTracks={true}
              />
            </CarouselView>
          </>
        )}
      </div>
      <ClearPinButton>Back to Grid</ClearPinButton>
    </>
  );
}

export interface FocusLayoutProps extends React.HTMLAttributes<HTMLElement> {
  trackParticipantPair?: TrackParticipantPair;
  onParticipantClick?: (evt: ParticipantClickEvent) => void;
}

export function FocusLayout({
  trackParticipantPair,
  onParticipantClick,
  ...props
}: FocusLayoutProps) {
  const { state } = useMaybePinContext();

  const pair: TrackParticipantPair | null = React.useMemo(() => {
    if (trackParticipantPair) {
      return trackParticipantPair;
    }
    if (state) {
      return state[0];
    }
    return null;
  }, [state, trackParticipantPair]);

  return (
    <div {...props}>
      {pair && <MediaTrack participant={pair.participant} source={pair.track.source} />}
    </div>
  );
}

export interface CarouselViewProps extends React.HTMLAttributes<HTMLMediaElement> {
  // participants: Participant[];
  // onParticipantClick?: (evt: ParticipantClickEvent) => void;
}

export function CarouselView({ ...props }: CarouselViewProps) {
  return (
    <aside {...props}>
      {props.children ?? <TrackLoop sources={[Track.Source.Camera]} excludePinnedTracks={true} />}
    </aside>
  );
}
