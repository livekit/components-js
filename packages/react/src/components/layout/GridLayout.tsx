import * as React from 'react';
// import { TileLoop } from '../TileLoop';
import { useParticipants, UseParticipantsOptions } from '../../hooks';
import { mergeProps } from '../../utils';
import { useSize } from '../../helper/resizeObserver';
import {
  GRID_LAYOUTS,
  ParticipantFilter,
  selectGridLayout,
  sortParticipantsByVolume,
} from '@livekit/components-core';
import { ParticipantContext } from '../../context';
import { Track } from 'livekit-client';
import { ParticipantTile } from '../../prefabs';

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
  const [gridLayout, setGridLayout] = React.useState(GRID_LAYOUTS[0]);
  const containerEl = React.createRef<HTMLDivElement>();
  const gridEl = React.createRef<HTMLDivElement>();
  const { width, height } = useSize(containerEl);
  const filteredParticipants = React.useMemo(
    () => (filter ? participants.filter(filter) : participants),
    [filter, participants, ...filterDependencies],
  );

  React.useEffect(() => {
    const desiredVisibleParticipantCount = filteredParticipants.length;
    if (width > 0 && height > 0) {
      const layout = selectGridLayout(GRID_LAYOUTS, desiredVisibleParticipantCount, width, height);
      if (gridEl.current && layout) {
        gridEl.current.style.setProperty('--lk-col-count', layout?.columns.toString());
      }
      setGridLayout(layout);
    }
  }, [filteredParticipants, gridEl, height, width]);

  // TODO: 2. Add pagination to handle participant overflow due to the limited number of visible participants.

  const visibleParticipants = React.useMemo(() => {
    const sortedParticipants = sortParticipantsByVolume(filteredParticipants);
    const visibleParticipants_ = sortedParticipants.slice(0, gridLayout.maxParticipants);
    console.log(
      `Grid displays ${visibleParticipants_.length} of all ${filteredParticipants.length} participants.`,
    );
    return visibleParticipants_;
  }, [filteredParticipants, gridLayout.maxParticipants]);

  const elementProps = React.useMemo(
    () => mergeProps(props, { className: 'lk-grid-layout' }),
    [props],
  );
  return (
    <div ref={containerEl} className="lk-grid-layout-wrapper">
      <div ref={gridEl} {...elementProps}>
        {props.children ?? (
          <>
            {visibleParticipants.map((participant) => (
              <ParticipantContext.Provider value={participant} key={participant.identity}>
                <ParticipantTile
                  key={`${participant.identity}-${Track.Source.Camera}-main`}
                  trackSource={Track.Source.Camera}
                />
                {/*  TODO: 3. Use TileLoop when it is ready to accept participants.
                 {props.children ?? <TileLoop filter={filter} filterDependencies={filterDependencies} />}
                  */}
              </ParticipantContext.Provider>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
