import type { TrackReferenceOrPlaceholder } from '@livekit/components-core';
import {
  setupFocusToggle,
  isTrackReferencePinned,
  isTrackReference,
} from '@livekit/components-core';
import type { Track, Participant } from 'livekit-client';
import { useEnsureParticipant, useMaybeLayoutContext } from '../context';
import { mergeProps } from '../mergeProps';
import * as React from 'react';

/** @public */
export interface UseFocusToggleProps {
  trackRef?: TrackReferenceOrPlaceholder;
  /** @deprecated This parameter will be removed in a future version use `trackRef` instead. */
  trackSource?: Track.Source;
  /** @deprecated This parameter will be removed in a future version use `trackRef` instead. */
  participant?: Participant;
  props: React.ButtonHTMLAttributes<HTMLButtonElement>;
}

/**
 * The `useFocusToggle` hook is used to implement the `FocusToggle` or your custom implementation of it.
 * The `TrackReferenceOrPlaceholder` is used to register a onClick handler and to identify the track to focus on.
 *
 * @example
 * ```tsx
 * const { mergedProps, inFocus } = useFocusToggle({ trackRef, props: yourButtonProps });
 * return <button {...mergedProps}>{inFocus ? 'Unfocus' : 'Focus'}</button>;
 * ```
 * @public
 */
export function useFocusToggle({ trackRef, trackSource, participant, props }: UseFocusToggleProps) {
  const p = useEnsureParticipant(participant);
  if (!trackRef && !trackSource) {
    throw new Error('trackRef or trackSource must be defined.');
  }
  const layoutContext = useMaybeLayoutContext();
  const { className } = React.useMemo(() => setupFocusToggle(), []);

  const inFocus: boolean = React.useMemo(() => {
    if (trackRef) {
      return isTrackReferencePinned(trackRef, layoutContext?.pin.state);
    } else if (trackSource) {
      const track = p.getTrack(trackSource);
      if (layoutContext?.pin.state && track) {
        return isTrackReferencePinned(
          { participant: p, source: trackSource, publication: track },
          layoutContext.pin.state,
        );
      } else {
        return false;
      }
    } else {
      throw new Error('trackRef or trackSource and participant must be defined.');
    }
  }, [trackRef, layoutContext?.pin.state, p, trackSource]);

  const mergedProps = React.useMemo(
    () =>
      mergeProps(props, {
        className,
        onClick: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
          // Call user defined on click callbacks.
          props.onClick?.(event);

          // Set or clear focus based on current focus state.
          if (trackRef && isTrackReference(trackRef)) {
            if (inFocus) {
              layoutContext?.pin.dispatch?.({
                msg: 'clear_pin',
              });
            } else {
              layoutContext?.pin.dispatch?.({
                msg: 'set_pin',
                trackReference: trackRef,
              });
            }
          } else if (trackSource) {
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
          }
        },
      }),
    [props, className, trackRef, trackSource, inFocus, layoutContext?.pin, p],
  );

  return { mergedProps, inFocus };
}
