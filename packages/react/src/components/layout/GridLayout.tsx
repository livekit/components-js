import * as React from 'react';
// import { TileLoop } from '../TileLoop';
import { useParticipants, UseParticipantsOptions } from '../../hooks';
import { mergeProps } from '../../utils';
import { useSize } from '../../helper/resizeObserver';
import {
  // isParticipantTrackPinned,
  // isTrackParticipantPair,
  TileFilter,
} from '@livekit/components-core';
// import { Track } from 'livekit-client';
// import { useMaybeLayoutContext } from '../../context';

export interface GridLayoutProps
  extends React.HTMLAttributes<HTMLDivElement>,
    Pick<UseParticipantsOptions, 'updateOnlyOn'> {
  /**
   * The grid shows all room participants. If only a subset of the participants
   * should be visible, they can be filtered.
   */
  filter?: TileFilter;
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
export function GridLayout({
  filter,
  updateOnlyOn = [],
  filterDependencies = [],
  ...props
}: GridLayoutProps) {
  const participants = useParticipants({
    updateOnlyOn: filter && updateOnlyOn.length === 0 ? undefined : updateOnlyOn,
  });
  const filteredParticipants = React.useMemo(() => {
    if (filter) {
      // TODO: Resolved with https://github.com/livekit/components-js/pull/326
      throw new Error('filter currently not working');
    }
    return participants;
  }, [filter, participants, ...filterDependencies]);

  const containerEl = React.createRef<HTMLDivElement>();
  const gridEl = React.createRef<HTMLDivElement>();

  const { width, height } = useSize(containerEl);

  React.useLayoutEffect(() => {
    const containerRatio = width / height;
    const tileRatio = 16 / 10;
    const colAdjust = Math.sqrt(containerRatio / tileRatio);
    const colFraction = Math.sqrt(filteredParticipants.length) * colAdjust;
    const cols = Math.max(filteredParticipants.length === 1 ? 1 : 2, Math.round(colFraction));
    // const widthAdjust = Math.min(100, 100 + (cols > colFraction ? 1 : -1) * (colFraction % 1) * 50);
    if (gridEl.current) {
      gridEl.current.style.setProperty('--lk-col-count', cols.toString());
      // gridEl.current.style.width = `${widthAdjust}%`;
    }
  }, [width, height, filteredParticipants, gridEl]);

  const elementProps = React.useMemo(
    () => mergeProps(props, { className: 'lk-grid-layout' }),
    [props],
  );
  return (
    <div ref={containerEl} className="lk-grid-layout-wrapper">
      <div ref={gridEl} {...elementProps}>
        {/* // TODO: UPDATED GridComponent Resolved with https://github.com/livekit/components-js/pull/326 */}
        {props.children}
        {/* ?? <TileLoop tiles={tiles} /> */}
      </div>
    </div>
  );
}
