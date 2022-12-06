import { isParticipantTrackPinned } from '@livekit/components-core';
import { Participant, Track } from 'livekit-client';
import * as React from 'react';
import { useMaybeFocusContext, useFocusContext } from '../contexts';
import { mergeProps } from '../utils';
import { MediaTrack } from '../components/participant/MediaTrack';
import { ParticipantClickEvent, ParticipantView } from '../components/participant/ParticipantView';
import { useParticipants, useSortedParticipants } from '../hooks';
import { ParticipantsLoop } from '../components/ParticipantsLoop';

interface FocusLayoutContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  focusParticipant?: Participant;
  focusTrackSource?: Track.Source;
  participants?: Array<Participant>;
  onParticipantClick?: (evt: ParticipantClickEvent) => void;
}

// TODO use (loudest) participant in focus, if no focusParticipant is provided
// TODO cleanup props
export function FocusLayoutContainer({
  focusParticipant,
  focusTrackSource,
  onParticipantClick,
  ...props
}: FocusLayoutContainerProps) {
  const elementProps = mergeProps(props, { className: 'lk-focus-layout' });
  const pinContext = useFocusContext();
  const participants = useSortedParticipants(useParticipants());

  return (
    <div {...elementProps}>
      {props.children ?? (
        <>
          {pinContext.state?.participantInFocus && (
            <FocusLayout participant={pinContext.state?.participantInFocus} />
          )}
          <CarouselView participants={participants} />
        </>
      )}
    </div>
  );
}

export interface FocusLayoutProps extends React.HTMLAttributes<HTMLElement> {
  participant: Participant;
  trackSource?: Track.Source;
  onParticipantClick?: (evt: ParticipantClickEvent) => void;
}

export function FocusLayout({
  participant,
  trackSource,
  onParticipantClick,
  ...props
}: FocusLayoutProps) {
  const { state } = useMaybeFocusContext();

  return (
    <div {...props}>
      {state?.participantInFocus && state.trackInFocus && (
        <MediaTrack participant={state?.participantInFocus} source={state.trackInFocus} />
      )}
    </div>
  );
}

export interface CarouselProps extends React.HTMLAttributes<HTMLMediaElement> {
  participants: Participant[];
  onParticipantClick?: (evt: ParticipantClickEvent) => void;
  showScreenShares?: boolean;
}

export function CarouselView({
  participants,
  showScreenShares,
  onParticipantClick,
  ...props
}: CarouselProps) {
  const { state: pinState } = useFocusContext();
  return (
    <aside {...props}>
      {showScreenShares && (
        <ParticipantsLoop
          filter={(ps) =>
            ps.filter((p) => {
              return !isParticipantTrackPinned(p, pinState, Track.Source.ScreenShare);
            })
          }
          filterDependencies={[pinState, participants]}
        >
          {props.children ?? (
            <ParticipantView
              trackSource={Track.Source.ScreenShare}
              onParticipantClick={onParticipantClick}
            />
          )}
        </ParticipantsLoop>
      )}
      <ParticipantsLoop
        filter={(ps) =>
          ps.filter((p) => {
            return !isParticipantTrackPinned(p, pinState, Track.Source.Camera);
          })
        }
        filterDependencies={[pinState]}
      >
        {props.children ?? <ParticipantView />}
      </ParticipantsLoop>
    </aside>
  );
}
