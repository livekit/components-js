import * as React from 'react';
import { LayoutContext, useMaybeTrackRefContext } from '../../context';
import { FocusToggleIcon, UnfocusToggleIcon } from '../../assets/icons';
import { useFocusToggle } from '../../hooks';
import type { TrackReferenceOrPlaceholder } from '@livekit/components-core';

/** @public */
export interface FocusToggleProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  trackRef?: TrackReferenceOrPlaceholder;
}

/**
 * The `FocusToggle` puts the `ParticipantTile` in focus or removes it from focus.
 * @remarks
 * This component needs to live inside `LayoutContext` to work properly.
 *
 * @example
 * ```tsx
 * <ParticipantTile>
 *   <FocusToggle />
 * </ParticipantTile>
 * ```
 * @public
 */
export function FocusToggle({ trackRef, ...props }: FocusToggleProps) {
  const trackRefFromContext = useMaybeTrackRefContext();

  const { mergedProps, inFocus } = useFocusToggle({
    trackRef: trackRef ?? trackRefFromContext,
    props,
  });

  return (
    <LayoutContext.Consumer>
      {(layoutContext) =>
        layoutContext !== undefined && (
          <button {...mergedProps}>
            {props.children ? (
              props.children
            ) : inFocus ? (
              <UnfocusToggleIcon />
            ) : (
              <FocusToggleIcon />
            )}
          </button>
        )
      }
    </LayoutContext.Consumer>
  );
}
