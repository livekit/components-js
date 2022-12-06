import { Participant, Track } from 'livekit-client';
import * as React from 'react';
import { mergeProps } from '../utils';
import { ParticipantView } from '../components/participant/ParticipantView';
import { ParticipantsLoop } from '../components/ParticipantsLoop';

export interface GridLayoutProps extends React.HTMLAttributes<HTMLDivElement> {
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
 * The GridLayout component displays the nested participants in a grid where every participants has the same size.
 *
 * @example
 * ```tsx
 * <LiveKitRoom>
 *   <GridLayout />
 * <LiveKitRoom>
 * ```
 */
export function GridLayout({ participants, showScreenShares, ...props }: GridLayoutProps) {
  const elementProps = mergeProps(props, { className: 'lk-grid-layout' });
  const filter = (ps: Array<Participant>) => participants ?? ps;
  return (
    <div {...elementProps}>
      {showScreenShares && (
        <ParticipantsLoop filter={filter} filterDependencies={[participants]}>
          {props.children ?? <ParticipantView trackSource={Track.Source.ScreenShare} />}
        </ParticipantsLoop>
      )}
      <ParticipantsLoop filter={filter} filterDependencies={[participants]}>
        {props.children ?? <ParticipantView />}
      </ParticipantsLoop>
    </div>
  );
}
