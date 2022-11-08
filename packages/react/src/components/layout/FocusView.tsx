import { isParticipantTrackPinned } from '@livekit/components-core';
import { Participant, Track } from 'livekit-client';
import * as React from 'react';
import { useMaybePinContext, usePinContext } from '../../contexts';
import { mergeProps } from '../../utils';
import { MediaTrack } from '../participant/MediaTrack';
import { ParticipantClickEvent, ParticipantView } from '../participant/Participant';
import { Participants, useParticipants, useSortedParticipants } from '../Participants';

interface FocusViewContainerProps extends React.HTMLAttributes<HTMLDivElement> {
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
  const pinContext = usePinContext();
  const participants = useSortedParticipants(useParticipants());

  return (
    <div {...elementProps}>
      {props.children ?? (
        <>
          {pinContext.state?.pinnedParticipant && (
            <FocusView participant={pinContext.state?.pinnedParticipant} />
          )}
          <CarouselView participants={participants} />
        </>
      )}
    </div>
  );
}

export interface FocusViewProps extends React.HTMLAttributes<HTMLElement> {
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
