import { Participant, Track } from 'livekit-client';
import React, { HTMLAttributes, useContext, useEffect } from 'react';
import { PinContext } from '../../contexts';
import { isParticipantTrackPinned, mergeProps } from '../../utils';
import { MediaTrack } from '../participant/MediaTrack';
import { ParticipantClickEvent, ParticipantView } from '../participant/Participant';
import { Participants, useSortedParticipants } from '../Participants';

interface FocusViewContainerProps extends HTMLAttributes<HTMLDivElement> {
  focusParticipant?: Participant;
  focusTrackSource?: Track.Source;
  participants?: Array<Participant>;
  onParticipantClick?: (evt: ParticipantClickEvent) => void;
}

// TODO use (loudest) participant in focus, if no focusParticipant is provided
export function FocusViewContainer({
  focusParticipant,
  focusTrackSource,
  onParticipantClick,
  ...props
}: FocusViewContainerProps) {
  const elementProps = mergeProps(props, { className: 'lk-participant-focus-view' });
  // const participants = useSortedParticipants(props.participants);
  const pinContext = useContext(PinContext);
  if (!pinContext) {
    throw new Error('FocusViewContainer needs to be wrapped in a PinContext');
  }
  // useEffect(() => {
  //   const focusTarget = focusParticipant ?? participants[0];
  //   if (focusTarget !== pinContext.state?.pinnedParticipant) {
  //     pinContext.dispatch?.({
  //       msg: 'set_pin',
  //       participant: focusTarget,
  //       source: focusTrackSource ?? Track.Source.Camera,
  //     });
  //   }
  // }, [participants]);

  return (
    <div {...elementProps}>
      {props.children ?? (
        <>
          {pinContext.state?.pinnedParticipant && (
            <FocusView participant={pinContext.state?.pinnedParticipant} />
          )}
          <CarouselView />
        </>
      )}
    </div>
  );
}

export interface FocusViewProps extends HTMLAttributes<HTMLElement> {
  participant: Participant;
  trackSource?: Track.Source;
  onParticipantClick?: (evt: ParticipantClickEvent) => void;
}

export function FocusView({
  participant,
  trackSource,
  onParticipantClick,
  ...props
}: FocusViewProps) {
  const { state } = useContext(PinContext);

  return (
    <div {...props}>
      {state?.pinnedParticipant && state.pinnedTrackSource && (
        <MediaTrack participant={state?.pinnedParticipant} source={state.pinnedTrackSource} />
      )}
    </div>
  );
}

export interface CarouselProps extends HTMLAttributes<HTMLMediaElement> {
  participants?: Participant[];
  onParticipantClick?: (evt: ParticipantClickEvent) => void;
  showScreenShares?: boolean;
}

export function CarouselView({
  participants,
  showScreenShares,
  onParticipantClick,
  ...props
}: CarouselProps) {
  const { state: pinState } = useContext(PinContext);
  const sortedParticipants = participants ?? useSortedParticipants();
  return (
    <aside {...props}>
      {showScreenShares && (
        <Participants
          filter={(ps) =>
            ps.filter((p) => {
              return !isParticipantTrackPinned(p, pinState, Track.Source.ScreenShare);
            })
          }
          filterDependencies={[pinState, sortedParticipants]}
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
