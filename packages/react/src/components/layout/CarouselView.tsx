import type { TrackReferenceOrPlaceholder } from '@livekit/components-core';
import { getScrollBarWidth } from '@livekit/components-core';
import * as React from 'react';
import { useSize } from '../../hooks/internal';
import { useVisualStableUpdate } from '../../hooks';
import { TrackLoop } from '../TrackLoop';

const MIN_HEIGHT = 130;
const MIN_WIDTH = 140;
const MIN_VISIBLE_TILES = 1;
const ASPECT_RATIO = 16 / 10;
const ASPECT_RATIO_INVERT = (1 - ASPECT_RATIO) * -1;

export interface CarouselViewProps extends React.HTMLAttributes<HTMLMediaElement> {
  tracks: TrackReferenceOrPlaceholder[];

  /** Place the tiles vertically or horizontally next to each other.
   * If undefined orientation is guessed by the dimensions of the container. */
  orientation?: 'vertical' | 'horizontal';
}

export function CarouselView({ tracks, orientation, ...props }: CarouselViewProps) {
  const asideEl = React.useRef<HTMLDivElement>(null);

  const { width, height } = useSize(asideEl);
  const carouselOrientation = orientation
    ? orientation
    : height >= width
    ? 'vertical'
    : 'horizontal';
  const tileHeight = Math.max(width * ASPECT_RATIO_INVERT, MIN_HEIGHT);
  const tileWidth = Math.max(height * ASPECT_RATIO, MIN_WIDTH);

  let maxVisibleTiles =
    carouselOrientation === 'vertical'
      ? Math.max(Math.floor(height / tileHeight), MIN_VISIBLE_TILES)
      : Math.max(Math.floor(width / tileWidth), MIN_VISIBLE_TILES);

  // To avoid an unstable UI state, on overflow, we need to consider the scrollbar wide.
  if (tracks.length > maxVisibleTiles) {
    const scrollBarWidth = getScrollBarWidth();
    maxVisibleTiles =
      carouselOrientation === 'vertical'
        ? Math.max(Math.floor(height / (tileHeight - scrollBarWidth)), MIN_VISIBLE_TILES)
        : Math.max(Math.floor(width / (tileWidth - scrollBarWidth)), MIN_VISIBLE_TILES);
  }

  const sortedTiles = useVisualStableUpdate(tracks, maxVisibleTiles);

  React.useLayoutEffect(() => {
    if (asideEl.current) {
      asideEl.current.dataset.lkOrientation = carouselOrientation;
      asideEl.current.style.setProperty('--lk-max-visible-tiles', maxVisibleTiles.toString());
    }
  }, [maxVisibleTiles, carouselOrientation]);

  return (
    <aside key={carouselOrientation} className="lk-carousel" ref={asideEl} {...props}>
      {props.children ?? <TrackLoop tracks={sortedTiles} />}
    </aside>
  );
}
