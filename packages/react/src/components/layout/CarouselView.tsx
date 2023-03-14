import { isTrackBundlePinned, TrackBundleFilter } from '@livekit/components-core';
import { Track } from 'livekit-client';
import * as React from 'react';
import { useMaybeLayoutContext } from '../../context';
import { useSize } from '../../hooks/internal';
import { useTracks, useVisualStableUpdate } from '../../hooks';
import { TrackLoop } from '../TrackLoop';

const MIN_HEIGHT = 130;
const MIN_WIDTH = 140;
const ASPECT_RATIO = 16 / 10;
const ASPECT_RATIO_INVERT = (1 - ASPECT_RATIO) * -1;

export interface CarouselViewProps extends React.HTMLAttributes<HTMLMediaElement> {
  filter?: TrackBundleFilter;
  filterDependencies?: [];
}

export function CarouselView({ filter, filterDependencies = [], ...props }: CarouselViewProps) {
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
  const orientation = height >= width ? 'vertical' : 'horizontal';
  const tileHeight = Math.max(width * ASPECT_RATIO_INVERT, MIN_HEIGHT);
  const tileWidth = Math.max(height * ASPECT_RATIO, MIN_WIDTH);

  const maxVisibleTiles =
    orientation === 'vertical'
      ? Math.max(1, Math.floor(height / tileHeight))
      : Math.floor(width / tileWidth);

  const sortedTiles = useVisualStableUpdate(filteredTiles, maxVisibleTiles);

  React.useEffect(() => {
    if (asideEl.current) {
      asideEl.current.dataset.lkOrientation = orientation;
      asideEl.current.style.setProperty('--lk-max-visible-tiles', maxVisibleTiles.toString());
    }
  }, [maxVisibleTiles, orientation]);

  return (
    <aside className="lk-carousel" ref={asideEl} {...props}>
      {props.children ?? <TrackLoop trackBundles={sortedTiles} />}
    </aside>
  );
}
