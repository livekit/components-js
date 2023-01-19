import { log } from '@livekit/components-core';
import * as React from 'react';
import { TileLoop } from '../components/TileLoop';
import { ParticipantFilter, useParticipants } from '../hooks';
import { mergeProps, useSize } from '../utils';

export interface GridLayoutProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * The grid shows all room participants. If only a subset of the participants
   * should be visible, they can be filtered.
   */
  filter?: ParticipantFilter;
  filterDependencies?: [];
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
export function GridLayout({ filter, filterDependencies, ...props }: GridLayoutProps) {
  const participants = useParticipants({ filter, filterDependencies });
  const gridEl = React.createRef<HTMLDivElement>();

  const { width, height } = useSize(gridEl);

  React.useEffect(() => {
    // log.debug({ width, height });
    const containerRatio = width / height;
    const tileRatio = 16 / 10;
    const colAdjust = containerRatio / tileRatio;
    const cols = Math.round(Math.sqrt(participants.length) * colAdjust);
    log.debug(colAdjust, Math.round(Math.sqrt(participants.length)), cols);

    gridEl.current?.style.setProperty('--lk-col-count', cols.toString());
  }, [width, height, participants]);

  // React.useEffect(() => {
  //   gridEl.current?.style.setProperty('--lk-p-count', participants.length.toFixed(0));
  //   gridEl.current?.style.setProperty(
  //     '--lk-col-count',
  //     Math.ceil(Math.sqrt(participants.length)).toString(),
  //   );
  // }, [participants, gridEl]);

  const elementProps = React.useMemo(
    () => mergeProps(props, { className: 'lk-grid-layout' }),
    [props],
  );
  return (
    <div ref={gridEl} {...elementProps}>
      {props.children ?? <TileLoop filter={filter} filterDependencies={filterDependencies} />}
    </div>
  );
}
