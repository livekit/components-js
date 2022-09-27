import { Participant, Track } from 'livekit-client';
import React, { HTMLAttributes } from 'react';
import { mergeProps } from '../../utils';
import { MediaTrack } from '../participant/MediaTrack';
import { ParticipantClickEvent, ParticipantView } from '../participant/Participant';
import { ParticipantName } from '../participant/ParticipantName';
import { Participants } from '../Participants';
import { DefaultParticipantView } from './DefaultParticipantView';

interface GridViewProps extends HTMLAttributes<HTMLDivElement> {
  participants?: Array<Participant>;
  onParticipantClick?: (evt: ParticipantClickEvent) => void;
}

export function GridView({ participants, onParticipantClick, ...props }: GridViewProps) {
  const elementProps = mergeProps(props, { className: 'lk-participant-grid-view' });
  const filter = (ps: Array<Participant>) => participants ?? ps;
  return (
    <div {...elementProps}>
      <Participants filter={filter} filterDependencies={[participants]}>
        {props.children ?? <DefaultParticipantView onParticipantClick={onParticipantClick} />}
      </Participants>
    </div>
  );
}
