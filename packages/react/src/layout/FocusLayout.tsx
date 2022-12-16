import { Participant, Track } from 'livekit-client';
import * as React from 'react';
import { useMaybePinContext, usePinContext } from '../contexts';
import { mergeProps } from '../utils';
import { MediaTrack } from '../components/participant/MediaTrack';
import { ParticipantClickEvent } from '../components/participant/ParticipantView';
import { useParticipants, useSortedParticipants } from '../hooks';
import { ClearPinButton } from '../components/ClearPinButton';
import { ParticipantsLoop } from '../components/ParticipantsLoop';

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
  const participants = useSortedParticipants({ participants: useParticipants({}) });

  return (
    <>
      <div {...elementProps}>
        {props.children ?? (
          <>
            {pinContext.state?.pinnedParticipant && (
              <FocusLayout participant={pinContext.state?.pinnedParticipant} />
            )}
            <CarouselView participants={participants}>
              <ParticipantsLoop includeScreenShares={true} />
            </CarouselView>
          </>
        )}
      </div>
      <ClearPinButton>Back to Grid</ClearPinButton>
    </>
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
      {state?.pinnedParticipant && state.pinnedSource && (
        <MediaTrack participant={state?.pinnedParticipant} source={state.pinnedSource} />
      )}
    </div>
  );
}

export interface CarouselViewProps extends React.HTMLAttributes<HTMLMediaElement> {
  participants: Participant[];
  onParticipantClick?: (evt: ParticipantClickEvent) => void;
}

export function CarouselView({ participants, onParticipantClick, ...props }: CarouselViewProps) {
  return <aside {...props}>{props.children ?? <ParticipantsLoop />}</aside>;
}
