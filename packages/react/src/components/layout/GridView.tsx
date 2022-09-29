import { Participant } from 'livekit-client';
import React, { HTMLAttributes } from 'react';
import { mergeProps } from '../../utils';
import { ParticipantClickEvent, ParticipantView } from '../participant/Participant';
import { Participants } from '../Participants';

export interface GridViewProps extends HTMLAttributes<HTMLDivElement> {
  participants?: Array<Participant>;
  onParticipantClick?: (evt: ParticipantClickEvent) => void;
}

export function GridView({ participants, onParticipantClick, ...props }: GridViewProps) {
  const elementProps = mergeProps(props, { className: 'lk-participant-grid-view' });
  const filter = (ps: Array<Participant>) => participants ?? ps;
  return (
    <div {...elementProps}>
      <Participants filter={filter} filterDependencies={[participants]}>
        {props.children ?? <ParticipantView onParticipantClick={onParticipantClick} />}
      </Participants>
    </div>
  );
}
