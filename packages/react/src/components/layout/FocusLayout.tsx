import { isParticipantTrackPinned } from '@livekit/components-core';
import { Participant, Track } from 'livekit-client';
import * as React from 'react';
import { useMaybePinContext, usePinContext } from '../../contexts';
import { mergeProps } from '../../utils';
import { MediaTrack } from '../participant/MediaTrack';
import { ParticipantClickEvent, ParticipantView } from '../participant/Participant';
import { Participants, useParticipants, useSortedParticipants } from '../Participants';

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
  const pinContext = usePinContext();
  const participants = useSortedParticipants(useParticipants());

  return (
    <div {...elementProps}>
      {props.children ?? (
        <>
          {pinContext.state?.pinnedParticipant && (
            <FocusLayout participant={pinContext.state?.pinnedParticipant} />
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
  const { state } = useMaybePinContext();

  return (
    <div {...props}>
      {state?.pinnedParticipant && state.pinnedTrackSource && (
        <MediaTrack participant={state?.pinnedParticipant} source={state.pinnedTrackSource} />
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
  const { state: pinState } = usePinContext();
  return (
    <aside {...props}>
      {showScreenShares && (
        <Participants
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
        </Participants>
      )}
      <Participants
        filter={(ps) =>
          ps.filter((p) => {
            return !isParticipantTrackPinned(p, pinState, Track.Source.Camera);
          })
        }
        filterDependencies={[pinState]}
      >
        {props.children ?? <ParticipantView />}
      </Participants>
    </aside>
  );
}
