import * as React from 'react';
import { useGridLayout, usePagination, UseParticipantsOptions } from '../../hooks';
import { mergeProps } from '../../utils';
import { createInteractingObservable, TrackReferenceOrPlaceholder } from '@livekit/components-core';
import { TrackLoop } from '../TrackLoop';
import { PaginationControl } from '../controls/PaginationControl';

export interface GridLayoutProps
  extends React.HTMLAttributes<HTMLDivElement>,
    Pick<UseParticipantsOptions, 'updateOnlyOn'> {
  tracks: TrackReferenceOrPlaceholder[];
}

/**
 * The GridLayout component displays the nested participants in a grid where every participants has the same size.
 *
 * @example
 * ```tsx
 * <LiveKitRoom>
 *   <GridLayout track={tracks} />
 * <LiveKitRoom>
 * ```
 */
export function GridLayout({ tracks, ...props }: GridLayoutProps) {
  const gridEl = React.createRef<HTMLDivElement>();

  const elementProps = React.useMemo(
    () => mergeProps(props, { className: 'lk-grid-layout' }),
    [props],
  );
  const { layout } = useGridLayout(gridEl, tracks.length);
  const pagination = usePagination(layout.maxTiles, tracks);

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
      <TrackLoop tracks={pagination.tracks}>{props.children}</TrackLoop>
      {tracks.length > layout.maxTiles && <PaginationControl {...pagination} />}
    </div>
  );
}
