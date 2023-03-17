import { Participant } from 'livekit-client';
import * as React from 'react';
import { useMaybeLayoutContext, useLayoutContext } from '../../context';
import { mergeProps } from '../../utils';
import { TrackReference } from '@livekit/components-core';
import { ParticipantTile } from '../participant/ParticipantTile';
import { ParticipantClickEvent } from '@livekit/components-core';
import { CarouselView } from './CarouselView';

export interface FocusLayoutContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  trackReference?: TrackReference;
  participants?: Array<Participant>;
}

export function FocusLayoutContainer({ trackReference, ...props }: FocusLayoutContainerProps) {
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
          {(hasFocus || trackReference) && <FocusLayout trackReference={trackReference} />}
        </>
      )}
    </div>
  );
}

export interface FocusLayoutProps extends React.HTMLAttributes<HTMLElement> {
  trackReference?: TrackReference;
  onParticipantClick?: (evt: ParticipantClickEvent) => void;
}

export function FocusLayout({ trackReference, ...props }: FocusLayoutProps) {
  const layoutContext = useMaybeLayoutContext();

  const trackReferenceInFocus: TrackReference | undefined = React.useMemo(() => {
    if (trackReference) {
      return trackReference;
    }
    if (layoutContext?.pin.state !== undefined && layoutContext.pin.state.length >= 1) {
      return layoutContext.pin.state[0];
    }
    return undefined;
  }, [layoutContext, trackReference]);

  return (
    <ParticipantTile
      {...props}
      participant={trackReferenceInFocus?.participant}
      trackSource={trackReferenceInFocus?.publication.source}
    />
  );
}
