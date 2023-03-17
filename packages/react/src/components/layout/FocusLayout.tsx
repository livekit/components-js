import { Participant } from 'livekit-client';
import * as React from 'react';
import { useMaybeLayoutContext, useLayoutContext } from '../../context';
import { mergeProps } from '../../utils';
import { TrackBundle } from '@livekit/components-core';
import { ParticipantTile } from '../participant/ParticipantTile';
import { ParticipantClickEvent } from '@livekit/components-core';
import { CarouselView } from './CarouselView';

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
    <div {...elementProps}>
      {props.children ?? (
        <>
          <CarouselView />
          {(hasFocus || trackBundle) && <FocusLayout trackBundle={trackBundle} />}
        </>
      )}
    </div>
  );
}

export interface FocusLayoutProps extends React.HTMLAttributes<HTMLElement> {
  trackBundle?: TrackBundle;
  onParticipantClick?: (evt: ParticipantClickEvent) => void;
}

export function FocusLayout({ trackBundle, ...props }: FocusLayoutProps) {
  const layoutContext = useMaybeLayoutContext();

  const trackBundleInFocus: TrackBundle | undefined = React.useMemo(() => {
    if (trackBundle) {
      return trackBundle;
    }
    if (layoutContext?.pin.state !== undefined && layoutContext.pin.state.length >= 1) {
      return layoutContext.pin.state[0];
    }
    return undefined;
  }, [layoutContext, trackBundle]);

  return (
    <ParticipantTile
      {...props}
      participant={trackBundleInFocus?.participant}
      trackSource={trackBundleInFocus?.publication.source}
    />
  );
}
