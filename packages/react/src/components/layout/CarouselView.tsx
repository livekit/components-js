import { isTrackBundlePinned, TrackBundleFilter } from '@livekit/components-core';
import { Track } from 'livekit-client';
import * as React from 'react';
import { useMaybeLayoutContext } from '../../context';
import { useSize } from '../../hooks/internal';
import { useTracks, useVisualStableUpdate } from '../../hooks';
import { TrackLoop } from '../TrackLoop';

const MIN_HEIGHT = 130;
const MIN_WIDTH = 140;
const MIN_VISIBLE_TILES = 1;
const ASPECT_RATIO = 16 / 10;
const ASPECT_RATIO_INVERT = (1 - ASPECT_RATIO) * -1;

export interface CarouselViewProps extends React.HTMLAttributes<HTMLMediaElement> {
  filter?: TrackBundleFilter;
  filterDependencies?: [];
  /** Place the tiles vertically or horizontally next to each other.
   * If undefined orientation is guessed by the dimensions of the container. */
  orientation?: 'vertical' | 'horizontal';
}

export function CarouselView({
  filter,
  filterDependencies = [],
  orientation,
  ...props
}: CarouselViewProps) {
  const asideEl = React.useRef<HTMLDivElement>(null);
  const layoutContext = useMaybeLayoutContext();
  const trackBundles = useTracks([
    { source: Track.Source.Camera, withPlaceholder: true },
    { source: Track.Source.ScreenShare, withPlaceholder: false },
  ]);
  const filteredTiles = React.useMemo(() => {
    const tilesWithoutPinned = trackBundles.filter(
      (tile) => !layoutContext?.pin.state || !isTrackBundlePinned(tile, layoutContext.pin.state),
    );
    return filter ? tilesWithoutPinned.filter(filter) : tilesWithoutPinned;
  }, [filter, layoutContext?.pin.state, trackBundles, ...filterDependencies]);

  const { width, height } = useSize(asideEl);
  const carouselOrientation = orientation
    ? orientation
    : height >= width
    ? 'vertical'
    : 'horizontal';
  const tileHeight = Math.max(width * ASPECT_RATIO_INVERT, MIN_HEIGHT);
  const tileWidth = Math.max(height * ASPECT_RATIO, MIN_WIDTH);

  const maxVisibleTiles =
    carouselOrientation === 'vertical'
      ? Math.max(Math.floor(height / tileHeight), MIN_VISIBLE_TILES)
      : Math.max(Math.floor(width / tileWidth), MIN_VISIBLE_TILES);

  const sortedTiles = useVisualStableUpdate(filteredTiles, maxVisibleTiles);

  React.useLayoutEffect(() => {
    if (asideEl.current) {
      asideEl.current.dataset.lkOrientation = carouselOrientation;
      asideEl.current.style.setProperty('--lk-max-visible-tiles', maxVisibleTiles.toString());
    }
  }, [maxVisibleTiles, carouselOrientation]);

  return (
    <aside key={carouselOrientation} className="lk-carousel" ref={asideEl} {...props}>
      {props.children ?? <TrackLoop trackBundles={sortedTiles} />}
    </aside>
  );
}
