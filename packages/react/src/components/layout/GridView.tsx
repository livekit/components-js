import { Participant, Track } from 'livekit-client';
import * as React from 'react';
import { mergeProps } from '../../utils';
import { ParticipantView } from '../participant/Participant';
import { Participants } from '../Participants';

export interface GridViewProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * If set to `true` screen shares are displayed with the participants.
   */
  showScreenShares?: boolean;
  /**
   * The grid shows all room participants. If only a subset of the participants
   * should be visible, they can be passed here.
   */
  participants?: Array<Participant>;
  // TODO maxVisibleParticipants
}

/**
 * The GridView component displays the nested participants in a grid where every participants has the same size.
 *
 * @example
 * ```tsx
 * import { DefaultRoomView } from '@livekit/components-react';
 *
 * <LiveKitRoom>
 *   <DefaultRoomView />
 * <LiveKitRoom>
 * ```
 */
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
