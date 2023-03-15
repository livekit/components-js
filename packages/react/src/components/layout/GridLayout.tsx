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
                  <div
                    className="lk-grid-pagination"
                    style={{
                      position: 'absolute',
                      bottom: '1rem',
                      left: '50%',
                      transform: 'translateX(-50%)',
                    }}
                  >
                    <button className="lk-button" onClick={prevPage}>
                      <svg fill="none" height="16" viewBox="0 0 16 16" width="16" xmlns="http://www.w3.org/2000/svg"><path clip-rule="evenodd" d="m5.29289 2.29289c.39053-.39052 1.02369-.39052 1.41422 0l4.82319 4.82323c.4882.48815.4882 1.27961 0 1.76776l-4.82319 4.82322c-.39053.3905-1.02369.3905-1.41422 0-.39052-.3905-.39052-1.0237 0-1.4142l4.2929-4.2929-4.2929-4.29289c-.39052-.39053-.39052-1.02369 0-1.41422z" fill="currentcolor" fill-rule="evenodd"/></svg>
                    </button>
                    <span className="lk-grid-pagination-count">
                      {`${currentPage} of ${totalPageCount}`}
                    </span>
                    <button className="lk-button" onClick={nextPage}>
                      <svg fill="none" height="16" viewBox="0 0 16 16" width="16" xmlns="http://www.w3.org/2000/svg"><path clip-rule="evenodd" d="m5.29289 2.29289c.39053-.39052 1.02369-.39052 1.41422 0l4.82319 4.82323c.4882.48815.4882 1.27961 0 1.76776l-4.82319 4.82322c-.39053.3905-1.02369.3905-1.41422 0-.39052-.3905-.39052-1.0237 0-1.4142l4.2929-4.2929-4.2929-4.29289c-.39052-.39053-.39052-1.02369 0-1.41422z" fill="currentcolor" fill-rule="evenodd"/></svg>
                    </button>
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
