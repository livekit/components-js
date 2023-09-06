import type { Participant, Track } from 'livekit-client';
import * as React from 'react';
import { LayoutContext, useMaybeTrackRefContext } from '../../context';
import { FocusToggleIcon, UnfocusToggleIcon } from '../../assets/icons';
import { useFocusToggle } from '../../hooks';
import type { TrackReferenceOrPlaceholder } from '@livekit/components-core';

/** @public */
export interface FocusToggleProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  trackRef?: TrackReferenceOrPlaceholder;
  /** @deprecated This parameter will be removed in a future version use `trackRef` instead. */
  trackSource?: Track.Source;
  /** @deprecated This parameter will be removed in a future version use `trackRef` instead. */
  participant?: Participant;
}

/**
 * The FocusToggle puts the ParticipantTile in focus or removes it from focus.
 *
 * @example
 * ```tsx
 * <ParticipantTile>
 *   <FocusToggle />
 * </ParticipantTile>
 * ```
 * @public
 */
export function FocusToggle({ trackRef, trackSource, participant, ...props }: FocusToggleProps) {
  const trackRefFromContext = useMaybeTrackRefContext();

  const { mergedProps, inFocus } = useFocusToggle({
    trackRef: trackRef ?? trackRefFromContext,
    trackSource,
    participant,
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
