import * as React from 'react';
import { TileLoop } from '../TileLoop';
import { useParticipants, UseParticipantsOptions } from '../../hooks';
import { mergeProps } from '../../utils';
import { useSize } from '../../helper/resizeObserver';
import { GRID_LAYOUTS, ParticipantFilter, selectGridLayout } from '@livekit/components-core';

export interface GridLayoutProps
  extends React.HTMLAttributes<HTMLDivElement>,
    Pick<UseParticipantsOptions, 'updateOnlyOn'> {
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
export function GridLayout({
  filter,
  updateOnlyOn = [],
  filterDependencies = [],
  ...props
}: GridLayoutProps) {
  const participants = useParticipants({
    updateOnlyOn: filter && updateOnlyOn.length === 0 ? undefined : updateOnlyOn,
  });
  const filteredParticipants = React.useMemo(
    () => (filter ? participants.filter(filter) : participants),
    [filter, participants, ...filterDependencies],
  );

  const containerEl = React.createRef<HTMLDivElement>();
  const gridEl = React.createRef<HTMLDivElement>();

  const { width, height } = useSize(containerEl);

  React.useEffect(() => {
    const desiredVisibleParticipantCount = filteredParticipants.length;

    if (width > 0 && height > 0) {
      const layout = selectGridLayout(GRID_LAYOUTS, desiredVisibleParticipantCount, width, height);
      if (gridEl.current && layout) {
        gridEl.current.style.setProperty('--lk-col-count', layout?.columns.toString());
      }
    }
  }, [filteredParticipants, gridEl, height, width]);

  const elementProps = React.useMemo(
    () => mergeProps(props, { className: 'lk-grid-layout' }),
    [props],
  );
  return (
    <div ref={containerEl} className="lk-grid-layout-wrapper">
      <div ref={gridEl} {...elementProps}>
        {props.children ?? <TileLoop filter={filter} filterDependencies={filterDependencies} />}
      </div>
    </div>
  );
}
