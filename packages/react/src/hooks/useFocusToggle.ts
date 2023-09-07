import { setupFocusToggle, isTrackReferencePinned } from '@livekit/components-core';
import type { Track, Participant } from 'livekit-client';
import { useEnsureParticipant, useMaybeLayoutContext } from '../context';
import { mergeProps } from '../mergeProps';
import * as React from 'react';

/** @public */
export interface UseFocusToggleProps {
  props: React.ButtonHTMLAttributes<HTMLButtonElement>;
  trackSource: Track.Source;
  participant?: Participant;
}

/** @public */
export function useFocusToggle({ trackSource, participant, props }: UseFocusToggleProps) {
  const p = useEnsureParticipant(participant);
  const layoutContext = useMaybeLayoutContext();
  const { className } = React.useMemo(() => setupFocusToggle(), []);

  const inFocus: boolean = React.useMemo(() => {
    const track = p.getTrack(trackSource);
    if (layoutContext?.pin.state && track) {
      return isTrackReferencePinned(
        { participant: p, source: trackSource, publication: track },
        layoutContext.pin.state,
      );
    } else {
      return false;
    }
  }, [p, trackSource, layoutContext]);

  const mergedProps = React.useMemo(
    () =>
      mergeProps(props, {
        className,
        onClick: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
          // Call user defined on click callbacks.
          props.onClick?.(event);

          // Set or clear focus based on current focus state.
          const track = p.getTrack(trackSource);
          if (layoutContext?.pin.dispatch && track) {
            if (inFocus) {
              layoutContext.pin.dispatch({
                msg: 'clear_pin',
              });
            } else {
              layoutContext.pin.dispatch({
                msg: 'set_pin',
                trackReference: {
                  participant: p,
                  publication: track,
                  source: track.source,
                },
              });
            }
          }
        },
      }),
    [props, className, p, trackSource, inFocus, layoutContext],
  );

  return { mergedProps, inFocus };
}
