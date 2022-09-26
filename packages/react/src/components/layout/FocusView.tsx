import { Participant, Track } from 'livekit-client';
import React, { HTMLAttributes, useEffect, useState } from 'react';
import { ParticipantContext } from '../../contexts';
import { mergeProps } from '../../utils';
import { MediaTrack } from '../participant/MediaTrack';
import { ParticipantClickEvent, ParticipantView } from '../participant/Participant';
import { useParticipants } from '../Participants';

interface FocusViewProps extends HTMLAttributes<HTMLDivElement> {
  focusParticipant?: Participant;
  focusTrackSource?: Track.Source;
  participants?: Array<Participant>;
  showPiP?: boolean;
  onParticipantClick?: (evt: ParticipantClickEvent) => void;
}

export function FocusView({
  showPiP,
  focusParticipant,
  focusTrackSource,
  onParticipantClick,
  ...props
}: FocusViewProps) {
  const defaultTrackSource = Track.Source.Camera;
  const elementProps = mergeProps(props, { className: 'lk-participant-focus-view' });
  const participants = props.participants ?? useParticipants();
  const [focusedParticipant, setFocusedParticipant] = useState(
    participants.find((p) => p.identity === focusParticipant?.identity),
  );
  const [others, setOthers] = useState(
    focusedParticipant
      ? participants.splice(participants.indexOf(focusedParticipant), 1)
      : participants,
  );
  useEffect(() => {
    setFocusedParticipant(participants.find((p) => p.identity === focusParticipant?.identity));
    setOthers(
      focusedParticipant
        ? participants.splice(participants.indexOf(focusedParticipant), 1)
        : participants,
    );
  }, [participants, focusParticipant]);
  return (
    <div {...elementProps}>
      <aside>
        {others.map((participant) => (
          <ParticipantContext.Provider value={participant} key={participant.identity}>
            <ParticipantView onParticipantClick={onParticipantClick}>
              <MediaTrack source={Track.Source.Camera} />
            </ParticipantView>
          </ParticipantContext.Provider>
        ))}
      </aside>
      {focusedParticipant && (
        <div className="lk-focused-participant">
          <ParticipantView participant={focusedParticipant}>
            <MediaTrack
              participant={focusedParticipant}
              source={focusTrackSource ?? defaultTrackSource}
            />
            {showPiP && focusTrackSource && focusTrackSource !== defaultTrackSource && (
              <div className="lk-pip-track">
                <MediaTrack source={defaultTrackSource}></MediaTrack>
              </div>
            )}
          </ParticipantView>
        </div>
      )}
    </div>
  );
}
