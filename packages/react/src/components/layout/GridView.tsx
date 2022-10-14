import { Participant, Track } from 'livekit-client';
import React, { HTMLAttributes } from 'react';
import { mergeProps } from '../../utils';
import { ParticipantClickEvent, ParticipantView } from '../participant/Participant';
import { Participants } from '../Participants';

export interface GridViewProps extends HTMLAttributes<HTMLDivElement> {
  participants?: Array<Participant>;
  showScreenShares?: boolean;
  // TODO maxVisibleParticipants
}

export function GridView({ participants, showScreenShares, ...props }: GridViewProps) {
  const elementProps = mergeProps(props, { className: 'lk-participant-grid-view' });
  const filter = (ps: Array<Participant>) => participants ?? ps;
  return (
    <div {...elementProps}>
      {showScreenShares && (
        <Participants filter={filter} filterDependencies={[participants]}>
          {props.children ?? <ParticipantView trackSource={Track.Source.ScreenShare} />}
        </Participants>
      )}
      <Participants filter={filter} filterDependencies={[participants]}>
        {props.children ?? <ParticipantView />}
      </Participants>
    </div>
  );
}
