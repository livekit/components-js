import { Participant, Track } from 'livekit-client';
import * as React from 'react';
import { TrackLoop } from '../components/TrackLoop';
import { mergeProps } from '../utils';

export interface GridLayoutProps extends React.HTMLAttributes<HTMLDivElement> {
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
export function GridLayout({ participants, ...props }: GridLayoutProps) {
  const elementProps = mergeProps(props, { className: 'lk-grid-layout' });
  return (
    <div {...elementProps}>
      {props.children ?? <TrackLoop sources={[Track.Source.Camera, Track.Source.ScreenShare]} />}
    </div>
  );
}
