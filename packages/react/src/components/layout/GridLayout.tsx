import * as React from 'react';
import { useGridLayout, usePagination, UseParticipantsOptions, useTracks } from '../../hooks';
import { mergeProps } from '../../utils';
import { TrackReferenceFilter, createInteractingObservable } from '@livekit/components-core';
import { Track } from 'livekit-client';
import { TrackLoop } from '../TrackLoop';
import { PaginationControl } from '../controls/PaginationControl';

export interface GridLayoutProps
  extends React.HTMLAttributes<HTMLDivElement>,
    Pick<UseParticipantsOptions, 'updateOnlyOn'> {
  /**
   * The grid shows all room participants. If only a subset of the participants
   * should be visible, they can be filtered.
   */
  filter?: TrackReferenceFilter;
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
  const rawTrackReferences = useTracks(
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

  const filteredTrackReferences = React.useMemo(
    () => (filter ? rawTrackReferences.filter(filter) : rawTrackReferences),
    [filter, rawTrackReferences, ...filterDependencies],
  );

  const { layout, trackReferences } = useGridLayout(gridEl, filteredTrackReferences);
  const pagination = usePagination(layout.maxParticipants, trackReferences.length);

  const [interactive, setInteractive] = React.useState(false);
  React.useEffect(() => {
    const subscription = createInteractingObservable(gridEl.current, 1000).subscribe(
      setInteractive,
    );
    return () => {
      subscription.unsubscribe();
    };
  }, [gridEl]);

  return (
    <div ref={gridEl} {...elementProps} data-lk-user-interaction={interactive}>
      {props.children ?? (
        <>
          {props.children ?? (
            <>
              <TrackLoop
                trackReferences={trackReferences.slice(
                  pagination.firstItemIndex,
                  pagination.lastItemIndex,
                )}
              />
              {trackReferences.length > layout.maxParticipants && (
                <PaginationControl {...pagination} />
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
