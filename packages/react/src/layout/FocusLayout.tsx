import { Participant, Track } from 'livekit-client';
import * as React from 'react';
import { useMaybePinContext, usePinContext } from '../contexts';
import { mergeProps } from '../utils';
import { ParticipantClickEvent, ParticipantTile } from '../components/participant/ParticipantView';
import { ClearPinButton } from '../components/ClearPinButton';
import { TrackLoop } from '../components/TrackLoop';
import { TrackParticipantPair } from '@livekit/components-core';

export interface FocusLayoutContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  trackParticipantPair?: TrackParticipantPair;
  participants?: Array<Participant>;
  onParticipantClick?: (evt: ParticipantClickEvent) => void;
}

export function FocusLayoutContainer({
  trackParticipantPair,
  onParticipantClick,
  ...props
}: FocusLayoutContainerProps) {
  const elementProps = mergeProps(props, { className: 'lk-focus-layout' });
  const pinContext = usePinContext();
  const hasFocus = React.useMemo(() => {
    return pinContext.state && pinContext.state.length >= 1;
  }, [pinContext]);

  return (
    <>
      <div {...elementProps}>
        {props.children ?? (
          <>
            {(hasFocus || trackParticipantPair) && (
              <FocusLayout trackParticipantPair={trackParticipantPair} />
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
    if (state !== undefined && state.length >= 1) {
      return state[0];
    }
    return null;
  }, [state, trackParticipantPair]);

  return (
    <>
      {pair && pair.track && (
        <ParticipantTile
          {...props}
          participant={pair.participant}
          trackSource={pair.track.source}
        />
      )}
    </>
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
