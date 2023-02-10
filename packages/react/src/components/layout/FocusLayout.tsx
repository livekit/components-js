import { Participant, Track } from 'livekit-client';
import * as React from 'react';
import { useLayoutContext } from '../../context';
import { mergeProps } from '../../utils';
import { IParticipantFilter, TrackParticipantPair } from '@livekit/components-core';
import { TileLoop } from '../TileLoop';
import { ParticipantTile } from '../../prefabs/ParticipantTile';
import { ParticipantClickEvent } from '@livekit/components-core';
import { useObservableState } from '../../helper';

export interface FocusLayoutContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  trackParticipantPair?: TrackParticipantPair;
  participants?: Array<Participant>;
}

export function FocusLayoutContainer({
  trackParticipantPair,
  ...props
}: FocusLayoutContainerProps) {
  const elementProps = mergeProps(props, { className: 'lk-focus-layout' });
  const { observable } = useLayoutContext().pin;
  const pinState = useObservableState(observable, observable.getValue());
  const hasFocus = React.useMemo(() => {
    return pinState && pinState.length >= 1;
  }, [pinState]);

  return (
    <>
      <div {...elementProps}>
        {props.children ?? (
          <>
            <CarouselView>
              <TileLoop excludePinnedTracks={true} />
            </CarouselView>
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
  const layoutContext = useLayoutContext();
  const state = useObservableState(
    layoutContext.pin.observable,
    layoutContext.pin.observable.getValue(),
  );

  const pair: TrackParticipantPair | null = React.useMemo(() => {
    if (trackParticipantPair) {
      return trackParticipantPair;
    }
    if (state !== undefined && state.length >= 1) {
      return state[0];
    }
    return null;
  }, [state, trackParticipantPair]);

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
  filters?: IParticipantFilter[];
}

export function CarouselView({ filters, ...props }: CarouselViewProps) {
  return (
    <aside {...props}>
      {props.children ?? (
        <TileLoop
          sources={[Track.Source.Camera, Track.Source.ScreenShare]}
          filters={filters}
          excludePinnedTracks={true}
        />
      )}
    </aside>
  );
}
