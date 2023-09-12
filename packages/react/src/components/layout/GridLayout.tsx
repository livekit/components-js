import * as React from 'react';
import type { UseParticipantsOptions } from '../../hooks';
import { useGridLayout, usePagination, useSwipe } from '../../hooks';
import { mergeProps } from '../../utils';
import type { TrackReferenceOrPlaceholder } from '@livekit/components-core';
import { TrackLoop } from '../TrackLoop';
import { PaginationControl } from '../controls/PaginationControl';
import { PaginationIndicator } from '../controls/PaginationIndicator';

/** @public */
export interface GridLayoutProps
  extends React.HTMLAttributes<HTMLDivElement>,
    Pick<UseParticipantsOptions, 'updateOnlyOn'> {
  children: React.ReactNode;
  tracks: TrackReferenceOrPlaceholder[];
}

/**
 * The `GridLayout` component displays the nested participants in a grid where every participants has the same size.
 * It also supports pagination if there are more participants than the grid can display.
 * @remarks
 * To ensure visual stability when tiles are reordered due to track updates,
 * the component uses the `useVisualStableUpdate` hook.
 * @example
 * ```tsx
 * <LiveKitRoom>
 *   <GridLayout tracks={tracks}>
 *     <ParticipantTile />
 *   </GridLayout>
 * <LiveKitRoom>
 * ```
 * @public
 */
export function GridLayout({ tracks, ...props }: GridLayoutProps) {
  const gridEl = React.createRef<HTMLDivElement>();

  const elementProps = React.useMemo(
    () => mergeProps(props, { className: 'lk-grid-layout' }),
    [props],
  );
  const { layout } = useGridLayout(gridEl, tracks.length);
  const pagination = usePagination(layout.maxTiles, tracks);

  useSwipe(gridEl, {
    onLeftSwipe: pagination.nextPage,
    onRightSwipe: pagination.prevPage,
  });

  return (
    <div ref={gridEl} data-lk-pagination={pagination.totalPageCount > 1} {...elementProps}>
      <TrackLoop tracks={pagination.tracks}>{props.children}</TrackLoop>
      {tracks.length > layout.maxTiles && (
        <>
          <PaginationIndicator
            totalPageCount={pagination.totalPageCount}
            currentPage={pagination.currentPage}
          />
          <PaginationControl pagesContainer={gridEl} {...pagination} />
        </>
      )}
    </div>
  );
}
