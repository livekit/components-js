import * as React from 'react';
import type { UseParticipantsOptions } from '../../hooks';
import { useGridLayout, usePagination, useSwipe } from '../../hooks';
import { mergeProps } from '../../utils';
import type { TrackReferenceOrPlaceholder } from '@cc-livekit/components-core';
import { TrackLoop } from '../TrackLoop';
import { PaginationControl } from '../controls/PaginationControl';
import { PaginationIndicator } from '../controls/PaginationIndicator';
import { useState } from 'react';

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
  // const [count, setCount] = useState(1);

  const elementProps = React.useMemo(
    () => mergeProps(props, { className: 'lk-grid-layout' }),
    [props],
  );
  const { layout } = useGridLayout(gridEl, tracks.length);
  // const { layout } = useGridLayout(gridEl, count);
  // const pagination = usePagination(layout.maxTiles, tracks);

  // useSwipe(gridEl, {
  //   onLeftSwipe: pagination.nextPage,
  //   onRightSwipe: pagination.prevPage,
  // });

  const { wrapperStyle } = layout ?? {};

  return (
    <div
      ref={gridEl}
      {...elementProps}
      style={{
        ...elementProps?.style,
        gridTemplateColumns: wrapperStyle?.gridTemplateColumns,
        height: wrapperStyle?.height,
      }}
    >
      {/* TODO: tracks and tracks.length */}
      <TrackLoop tracks={tracks} participantCount={tracks.length}>
        {props.children}
      </TrackLoop>
      {/* <button style={{ position: 'fixed' }} onClick={() => setCount((prev) => prev + 1)}>
        add
      </button>
      <button style={{ position: 'fixed', left: 200 }} onClick={() => setCount((prev) => prev - 1)}>
        reduce
      </button> */}
      {/* {tracks.length > layout.maxTiles && (
        <>
          <PaginationIndicator
            totalPageCount={pagination.totalPageCount}
            currentPage={pagination.currentPage}
          />
          <PaginationControl pagesContainer={gridEl} {...pagination} />
        </>
      )} */}
    </div>
  );
}
