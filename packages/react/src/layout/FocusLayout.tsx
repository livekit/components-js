import { isParticipantTrackPinned } from '@livekit/components-core';
import { Participant, Track } from 'livekit-client';
import * as React from 'react';
import { useMaybePinContext, usePinContext } from '../contexts';
import { mergeProps } from '../utils';
import { MediaTrack } from '../components/participant/MediaTrack';
import { ParticipantClickEvent, ParticipantView } from '../components/participant/ParticipantView';
import { useParticipants, useSortedParticipants } from '../hooks';
import { ParticipantsLoop } from '../components/ParticipantsLoop';
import { ClearPinButton } from '../components/ClearPinButton';

interface FocusLayoutContainerProps extends React.HTMLAttributes<HTMLDivElement> {
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
            <CarouselView participants={participants} showScreenShares={true} />
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
        <ParticipantsLoop
          filter={(ps) =>
            ps.filter((p) => {
              return (
                !isParticipantTrackPinned(p, pinState, Track.Source.ScreenShare) &&
                p.getTrack(Track.Source.ScreenShare)
              );
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
