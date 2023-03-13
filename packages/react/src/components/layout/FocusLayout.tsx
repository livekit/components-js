import { Participant, Track } from 'livekit-client';
import * as React from 'react';
import { useMaybeLayoutContext, useLayoutContext } from '../../context';
import { mergeProps } from '../../utils';
import { isTrackBundlePinned, TrackBundleFilter, TrackBundle } from '@livekit/components-core';
import { ParticipantTile } from '../../prefabs/ParticipantTile';
import { ParticipantClickEvent } from '@livekit/components-core';
import { useTracks, useVisualStableUpdate } from '../../hooks';
import { TrackLoop } from '../TrackLoop';
import { useSize } from '../../helper';

export interface FocusLayoutContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  trackBundle?: TrackBundle;
  participants?: Array<Participant>;
}

export function FocusLayoutContainer({ trackBundle, ...props }: FocusLayoutContainerProps) {
  const elementProps = mergeProps(props, { className: 'lk-focus-layout' });
  const pinContext = useLayoutContext().pin;
  const hasFocus = React.useMemo(() => {
    return pinContext.state && pinContext.state.length >= 1;
  }, [pinContext]);

  return (
    <>
      <div {...elementProps}>
        {props.children ?? (
          <>
            <CarouselView />
            {(hasFocus || trackBundle) && <FocusLayout trackBundle={trackBundle} />}
          </>
        )}
      </div>
    </>
  );
}

export interface FocusLayoutProps extends React.HTMLAttributes<HTMLElement> {
  trackBundle?: TrackBundle;
  onParticipantClick?: (evt: ParticipantClickEvent) => void;
}

export function FocusLayout({ trackBundle, ...props }: FocusLayoutProps) {
  const layoutContext = useMaybeLayoutContext();

  const trackBundle_: TrackBundle | null = React.useMemo(() => {
    if (trackBundle) {
      return trackBundle;
    }
    if (layoutContext?.pin.state !== undefined && layoutContext.pin.state.length >= 1) {
      return layoutContext.pin.state[0];
    }
    return null;
  }, [layoutContext, trackBundle]);

  return (
    <>
      {trackBundle_ && trackBundle_.publication && (
        <ParticipantTile
          {...props}
          participant={trackBundle_.participant}
          trackSource={trackBundle_.publication.source}
        />
      )}
    </>
  );
}

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
    <aside ref={asideEl} {...props}>
      {props.children ?? <TrackLoop trackBundles={sortedTiles} />}
    </aside>
  );
}
