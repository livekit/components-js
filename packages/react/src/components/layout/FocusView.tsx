import { Participant, Track } from 'livekit-client';
import React, { HTMLAttributes, useEffect, useState } from 'react';
import { ParticipantContext } from '../../contexts';
import { mergeProps } from '../../utils';
import { MediaTrack } from '../participant/MediaTrack';
import { ParticipantClickEvent, ParticipantView } from '../participant/Participant';
import { ParticipantName } from '../participant/ParticipantName';
import { useParticipants, useSortedParticipants } from '../Participants';

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
  const participants = useSortedParticipants(props.participants);

  const [others, setOthers] = useState<Participant[]>([]);
  useEffect(() => {
    setOthers(
      focusParticipant
        ? participants.filter((p) => p.identity !== focusParticipant.identity)
        : participants,
    );
  }, [participants, focusParticipant]);
  return (
    <div {...elementProps}>
      {focusParticipant && (
        <div className="lk-focused-participant">
          <ParticipantContext.Provider value={focusParticipant}>
            <ParticipantView>
              <MediaTrack source={focusTrackSource ?? defaultTrackSource} />
              <ParticipantName />
              {showPiP && focusTrackSource && focusTrackSource !== defaultTrackSource && (
                <div className="lk-pip-track">
                  <MediaTrack source={defaultTrackSource}></MediaTrack>
                </div>
              )}
            </ParticipantView>
          </ParticipantContext.Provider>
        </div>
      )}
      <aside>
        {others.map((participant) => (
          <ParticipantContext.Provider value={participant} key={participant.identity}>
            <ParticipantView>
              <MediaTrack source={Track.Source.Camera} onTrackClick={onParticipantClick} />
              <ParticipantName />
            </ParticipantView>
          </ParticipantContext.Provider>
        ))}
      </aside>
    </div>
  );
}
