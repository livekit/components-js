import { Participant, Track } from 'livekit-client';
import React, { createContext, HTMLAttributes, ReactNode, useEffect, useState } from 'react';
import {
  FocusViewContext,
  FocusViewState,
  ParticipantContext,
  useMaybeFocusViewContext,
} from '../../contexts';
import { cloneSingleChild, mergeProps } from '../../utils';
import { TrackSource } from '../controls/MediaControl';
import { MediaTrack } from '../participant/MediaTrack';
import { ParticipantClickEvent, ParticipantView } from '../participant/Participant';
import { ParticipantName } from '../participant/ParticipantName';
import { useParticipants, useSortedParticipants } from '../Participants';

interface FocusViewContainerProps extends HTMLAttributes<HTMLDivElement> {
  focusParticipant?: Participant;
  focusTrackSource?: Track.Source;
  participants?: Array<Participant>;
  showPiP?: boolean;
  onParticipantClick?: (evt: ParticipantClickEvent) => void;
}

// TODO use (loudest) participant in focus, if no focusParticipant is provided
export function FocusViewContainer({
  showPiP,
  focusParticipant,
  focusTrackSource,
  onParticipantClick,
  ...props
}: FocusViewContainerProps) {
  const elementProps = mergeProps(props, { className: 'lk-participant-focus-view' });
  const participants = useSortedParticipants(props.participants);
  const [focusOrLoudest, setFocusOrLoudest] = useState<Participant | undefined>(undefined);
  const [others, setOthers] = useState<Participant[]>(
    focusOrLoudest
      ? participants.filter(
          (p) =>
            p.identity !== focusOrLoudest.identity ||
            (focusTrackSource !== Track.Source.Camera && !showPiP),
        )
      : participants,
  );

  const [focusViewState, setFocusViewState] = useState<FocusViewState>({
    focusParticipant: focusOrLoudest,
    focusTrackSource,
    others,
  });

  useEffect(() => {
    const focusTarget = focusParticipant ?? participants[0];
    setFocusOrLoudest(focusTarget);
    const otherPs = focusTarget
      ? participants.filter(
          (p) =>
            p.identity !== focusTarget.identity ||
            (focusTrackSource !== Track.Source.Camera && !showPiP),
        )
      : participants;
    setOthers(otherPs);
    setFocusViewState({ focusParticipant: focusTarget, focusTrackSource, others: otherPs });
  }, [participants, focusParticipant, focusTrackSource]);
  return (
    <div {...elementProps}>
      <FocusViewContext.Provider value={focusViewState}>
        {props.children ?? (
          <>
            {focusOrLoudest && (
              <FocusView
                participant={focusOrLoudest}
                trackSource={focusTrackSource}
                showPiP={showPiP}
              />
            )}
            <CarouselView participants={others} onParticipantClick={onParticipantClick} />
          </>
        )}
      </FocusViewContext.Provider>
    </div>
  );
}

export interface FocusViewProps extends HTMLAttributes<HTMLElement> {
  participant: Participant;
  trackSource?: Track.Source;
  showPiP?: boolean;
  onParticipantClick?: (evt: ParticipantClickEvent) => void;
}

export function FocusView({
  participant,
  trackSource,
  showPiP,
  onParticipantClick,
  ...props
}: FocusViewProps) {
  const defaultTrackSource = Track.Source.Camera;
  return (
    <div {...props} className="lk-focused-participant">
      <ParticipantContext.Provider value={participant}>
        <ParticipantView>
          <MediaTrack source={trackSource ?? defaultTrackSource} />
          <ParticipantName />
          {showPiP &&
            trackSource &&
            // TODO  re-enable once this has landed in livekit-client
            // && !participant.isLocal
            trackSource !== defaultTrackSource && (
              <div className="lk-pip-track">
                <MediaTrack source={defaultTrackSource}></MediaTrack>
              </div>
            )}
        </ParticipantView>
      </ParticipantContext.Provider>
    </div>
  );
}

export interface CarouselProps extends HTMLAttributes<HTMLMediaElement> {
  participants?: Participant[];
  onParticipantClick?: (evt: ParticipantClickEvent) => void;
}

export function CarouselView({ participants, onParticipantClick, ...props }: CarouselProps) {
  const ps = participants ?? useMaybeFocusViewContext()?.others ?? useParticipants();
  return (
    <aside {...props}>
      {ps.map((participant) => (
        <ParticipantContext.Provider value={participant} key={participant.identity}>
          {props.children ? (
            cloneSingleChild(props.children, { onParticipantClick })
          ) : (
            <ParticipantView participant={participant} onParticipantClick={onParticipantClick} />
          )}
        </ParticipantContext.Provider>
      ))}
    </aside>
  );
}
