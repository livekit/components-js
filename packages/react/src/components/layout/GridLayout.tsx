import * as React from 'react';
import { useGridLayout, usePagination, UseParticipantsOptions, useTracks } from '../../hooks';
import { mergeProps } from '../../utils';
import { TrackBundleFilter } from '@livekit/components-core';
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
  const gridEl = React.createRef<HTMLDivElement>();
  const rawTrackBundles = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { updateOnlyOn: updateOnlyOn ? updateOnlyOn : undefined },
  );

  const elementProps = React.useMemo(
    () => mergeProps(props, { className: 'lk-grid-layout' }),
    [props],
  );

  const filteredTrackBundles = React.useMemo(
    () => (filter ? rawTrackBundles.filter(filter) : rawTrackBundles),
    [filter, rawTrackBundles, ...filterDependencies],
  );

  const { layout, trackBundles } = useGridLayout(gridEl, filteredTrackBundles);
  const { totalPageCount, nextPage, prevPage, currentPage, firstItemIndex, lastItemIndex } =
    usePagination(layout.maxParticipants, trackBundles.length);

  return (
    <div className="lk-grid-layout-wrapper">
      <div ref={gridEl} {...elementProps}>
        {props.children ?? (
          <>
            {props.children ?? (
              <>
                <TrackLoop trackBundles={trackBundles.slice(firstItemIndex, lastItemIndex)} />

                {trackBundles.length > layout.maxParticipants && (
                  <div>
                    <button onClick={prevPage}>{'<'}</button>
                    {`${currentPage}/${totalPageCount}`}
                    <button onClick={nextPage}>{'>'}</button>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
