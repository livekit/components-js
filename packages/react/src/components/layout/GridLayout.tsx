import * as React from 'react';
import { UseParticipantsOptions, useTracks } from '../../hooks';
import { mergeProps } from '../../utils';
import { useSize } from '../../helper/resizeObserver';
import {
  GRID_LAYOUTS,
  selectGridLayout,
  sortTrackParticipantPairs,
  TrackBundleFilter,
  TrackBundleWithPlaceholder,
} from '@livekit/components-core';
import { Track } from 'livekit-client';
import { TrackLoop } from '../TrackLoop';

export interface GridLayoutProps
  extends React.HTMLAttributes<HTMLDivElement>,
    Pick<UseParticipantsOptions, 'updateOnlyOn'> {
  /**
   * The grid shows all room participants. If only a subset of the participants
   * should be visible, they can be filtered.
   */
  filter?: TrackBundleFilter;
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
  updateOnlyOn,
  filterDependencies = [],
  ...props
}: GridLayoutProps) {
  const trackBundles = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { updateOnlyOn: updateOnlyOn ? updateOnlyOn : undefined },
  );
  console.log({ trackBundles });

  const [gridLayout, setGridLayout] = React.useState(GRID_LAYOUTS[0]);
  const containerEl = React.createRef<HTMLDivElement>();
  const gridEl = React.createRef<HTMLDivElement>();
  const { width, height } = useSize(containerEl);
  const filteredTrackBundles = React.useMemo(
    () => (filter ? trackBundles.filter(filter) : trackBundles),
    [filter, trackBundles, ...filterDependencies],
  );

  React.useEffect(() => {
    if (width > 0 && height > 0) {
      const layout = selectGridLayout(GRID_LAYOUTS, filteredTrackBundles.length, width, height);
      if (gridEl.current && layout) {
        gridEl.current.style.setProperty('--lk-col-count', layout?.columns.toString());
      }
      setGridLayout(layout);
    }
  }, [filteredTrackBundles, gridEl, height, width]);

  // TODO: 2. Add pagination to handle participant overflow due to the limited number of visible participants.

  const visibleTiles = React.useMemo<TrackBundleWithPlaceholder[]>(() => {
    // const sortedTrackBundles = sortParticipantsByVolume(filteredTrackBundles);
    const sortedTrackBundles = sortTrackParticipantPairs(filteredTrackBundles);
    const visibleTrackBundles = sortedTrackBundles.slice(0, gridLayout.maxParticipants);
    console.log(
      `Grid displays ${visibleTrackBundles.length} of all ${filteredTrackBundles.length} participants.`,
    );
    return visibleTrackBundles;
  }, [filteredTrackBundles, gridLayout.maxParticipants, trackBundles]);

  const elementProps = React.useMemo(
    () => mergeProps(props, { className: 'lk-grid-layout' }),
    [props],
  );
  return (
    <div ref={containerEl} className="lk-grid-layout-wrapper">
      <div ref={gridEl} {...elementProps}>
        {props.children ?? <>{props.children ?? <TrackLoop trackBundles={visibleTiles} />}</>}
      </div>
    </div>
  );
}
