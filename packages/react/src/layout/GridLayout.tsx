import { Participant } from 'livekit-client';
import * as React from 'react';
import { TileLoop } from '../components/TileLoop';
import { useParticipants } from '../hooks';
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
export function GridLayout({ ...props }: GridLayoutProps) {
  const participants = useParticipants();

  const gridEl = React.createRef<HTMLDivElement>();

  React.useEffect(() => {
    gridEl.current?.style.setProperty('--lk-p-count', participants.length.toFixed(0));
  }, [participants, gridEl]);
  const elementProps = React.useMemo(
    () => mergeProps(props, { className: 'lk-grid-layout' }),
    [props],
  );
  return (
    <div ref={gridEl} {...elementProps}>
      {props.children ?? <TileLoop />}
    </div>
  );
}
