import { isTrackBundlePinned, TrackBundleFilter } from '@livekit/components-core';
import { Track } from 'livekit-client';
import * as React from 'react';
import { useMaybeLayoutContext } from '../../context';
import { useSize } from '../../helper';
import { useTracks, useVisualStableUpdate } from '../../hooks';
import { TrackLoop } from '../TrackLoop';

export interface CarouselViewProps extends React.HTMLAttributes<HTMLMediaElement> {
  filter?: TrackBundleFilter;
  filterDependencies?: [];
}

export function CarouselView({ filter, filterDependencies = [], ...props }: CarouselViewProps) {
  const asideEl = React.useRef(null);
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

  let tileCount = 5;
  const { width, height } = useSize(asideEl);
  if (height >= width) {
    const tileHeight = width * 0.5625; // Based on the width calculate the tile hight for a 16/9 tile.
    tileCount = Math.max(1, Math.floor(height / Math.max(tileHeight, 1)) - 1);
  } else {
    const tileWidth = height * 1.777777777777777; // Based on the height calculate the tile hight for a 16/9 tile.
    tileCount = Math.floor(width / tileWidth);
  }
  const sortedTiles = useVisualStableUpdate(filteredTiles, tileCount);

  return (
    <aside className="lk-carousel" ref={asideEl} {...props}>
      {props.children ?? <TrackLoop trackBundles={sortedTiles} />}
    </aside>
  );
}
