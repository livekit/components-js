import type { TrackReferenceOrPlaceholder } from '@livekit/components-core';
import { setupFocusToggle, isTrackReferencePinned } from '@livekit/components-core';
import { useEnsureTrackRef, useMaybeLayoutContext } from '../context';
import { mergeProps } from '../mergeProps';
import * as React from 'react';

/** @public */
export interface UseFocusToggleProps {
  trackRef?: TrackReferenceOrPlaceholder;
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
export function useFocusToggle({ trackRef, props }: UseFocusToggleProps) {
  const trackReference = useEnsureTrackRef(trackRef);

  const layoutContext = useMaybeLayoutContext();
  const { className } = React.useMemo(() => setupFocusToggle(), []);

  const inFocus: boolean = React.useMemo(() => {
    return isTrackReferencePinned(trackReference, layoutContext?.pin.state);
  }, [trackReference, layoutContext?.pin.state]);

  const mergedProps = React.useMemo(
    () =>
      mergeProps(props, {
        className,
        onClick: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
          // Call user defined on click callbacks.
          props.onClick?.(event);

          // Set or clear focus based on current focus state.
          if (inFocus) {
            layoutContext?.pin.dispatch?.({
              msg: 'clear_pin',
            });
          } else {
            layoutContext?.pin.dispatch?.({
              msg: 'set_pin',
              trackReference,
            });
          }
        },
      }),
    [props, className, trackReference, inFocus, layoutContext?.pin],
  );

  return { mergedProps, inFocus };
}
