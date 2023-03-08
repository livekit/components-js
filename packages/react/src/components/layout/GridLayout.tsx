import * as React from 'react';
import { UseParticipantsOptions, useTracks } from '../../hooks';
import { mergeProps } from '../../utils';
import { useSize } from '../../helper/resizeObserver';
import {
  GRID_LAYOUTS,
  selectGridLayout,
  sortTrackBundles,
  TrackBundleFilter,
  TrackBundleWithPlaceholder,
  updatePages,
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
  const rawTrackBundles = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { updateOnlyOn: updateOnlyOn ? updateOnlyOn : undefined },
  );

  const stateTrackBundles = React.useRef<TrackBundleWithPlaceholder[]>([]);
  const maxTilesOnPage = React.useRef<number>(1);
  const containerEl = React.createRef<HTMLDivElement>();
  const gridEl = React.createRef<HTMLDivElement>();
  const { width, height } = useSize(containerEl);

  const layout =
    width > 0 && height > 0
      ? selectGridLayout(GRID_LAYOUTS, rawTrackBundles.length, width, height)
      : GRID_LAYOUTS[0];

  const filteredTrackBundles = React.useMemo(
    () => (filter ? rawTrackBundles.filter(filter) : rawTrackBundles),
    [filter, rawTrackBundles, ...filterDependencies],
  );
  const nextSortedTrackBundles = sortTrackBundles(filteredTrackBundles);
  const trackBundles =
    layout.maxParticipants !== maxTilesOnPage.current
      ? nextSortedTrackBundles
      : updatePages(stateTrackBundles.current, nextSortedTrackBundles, layout.maxParticipants);

  // Save info for next render to update with minimal visual change.
  stateTrackBundles.current = trackBundles;
  maxTilesOnPage.current = layout.maxParticipants;

  React.useEffect(() => {
    if (gridEl.current && layout) {
      gridEl.current.style.setProperty('--lk-col-count', layout?.columns.toString());
    }
  }, [gridEl, layout]);

  const elementProps = React.useMemo(
    () => mergeProps(props, { className: 'lk-grid-layout' }),
    [props],
  );
  return (
    <div ref={containerEl} className="lk-grid-layout-wrapper">
      <div ref={gridEl} {...elementProps}>
        {props.children ?? (
          <>
            {props.children ?? (
              <TrackLoop trackBundles={trackBundles.slice(0, layout.maxParticipants)} />
            )}
          </>
        )}
      </div>
    </div>
  );
}
