import type { Participant, Track } from 'livekit-client';
import * as React from 'react';
import { LayoutContext } from '../../context';
import { FocusToggleIcon, UnfocusToggleIcon } from '../../assets/icons';
import { useFocusToggle } from '../../hooks';

/** @public */
export interface FocusToggleProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  trackSource: Track.Source;
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
export function FocusToggle({ trackSource, participant, ...props }: FocusToggleProps) {
  const { mergedProps, inFocus } = useFocusToggle({ trackSource, participant, props });

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
