import { Participant, Track } from 'livekit-client';
import * as React from 'react';
import { useMaybeLayoutContext, useLayoutContext } from '../../context';
import { mergeProps } from '../../utils';
import {
  isParticipantTrackPinned,
  isTrackParticipantPair,
  TileFilter,
  TrackParticipantPair,
} from '@livekit/components-core';
import { ParticipantTile } from '../../prefabs/ParticipantTile';
import { ParticipantClickEvent } from '@livekit/components-core';
import { useTracks } from '../../hooks';
import { TrackLoop } from '../TrackLoop';

export interface FocusLayoutContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  trackParticipantPair?: TrackParticipantPair;
  participants?: Array<Participant>;
}

export function FocusLayoutContainer({
  trackParticipantPair,
  ...props
}: FocusLayoutContainerProps) {
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
            {(hasFocus || trackParticipantPair) && (
              <FocusLayout trackParticipantPair={trackParticipantPair} />
            )}
          </>
        )}
      </div>
    </>
  );
}

export interface FocusLayoutProps extends React.HTMLAttributes<HTMLElement> {
  trackParticipantPair?: TrackParticipantPair;
  onParticipantClick?: (evt: ParticipantClickEvent) => void;
}

export function FocusLayout({ trackParticipantPair, ...props }: FocusLayoutProps) {
  const layoutContext = useMaybeLayoutContext();

  const pair: TrackParticipantPair | null = React.useMemo(() => {
    if (trackParticipantPair) {
      return trackParticipantPair;
    }
    if (layoutContext?.pin.state !== undefined && layoutContext.pin.state.length >= 1) {
      return layoutContext.pin.state[0];
    }
    return null;
  }, [layoutContext, trackParticipantPair]);

  return (
    <>
      {pair && pair.track && (
        <ParticipantTile
          {...props}
          participant={pair.participant}
          trackSource={pair.track.source}
        />
      )}
    </>
  );
}

export interface CarouselViewProps extends React.HTMLAttributes<HTMLMediaElement> {
  filter?: TileFilter;
  filterDependencies?: [];
}

export function CarouselView({ filter, filterDependencies = [], ...props }: CarouselViewProps) {
  const layoutContext = useMaybeLayoutContext();
  const tiles = useTracks([
    { source: Track.Source.Camera, withPlaceholder: true },
    { source: Track.Source.ScreenShare, withPlaceholder: false },
  ]);
  const filteredTiles = React.useMemo(() => {
    const tilesWithoutPinned = tiles.filter(
      (tile) =>
        !layoutContext?.pin.state ||
        !isTrackParticipantPair(tile) ||
        !isParticipantTrackPinned(tile, layoutContext.pin.state),
    );
    return filter ? tilesWithoutPinned.filter(filter) : tilesWithoutPinned;
  }, [filter, layoutContext?.pin.state, tiles, ...filterDependencies]);

  return <aside {...props}>{props.children ?? <TrackLoop pairs={filteredTiles} />}</aside>;
}
