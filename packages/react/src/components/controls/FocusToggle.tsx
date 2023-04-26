import { isTrackReferencePinned, setupFocusToggle } from '@livekit/components-core';
import type { Participant, Track } from 'livekit-client';
import * as React from 'react';
import { LayoutContext, useEnsureParticipant, useMaybeLayoutContext } from '../../context';
import { FocusToggleIcon, UnfocusToggleIcon } from '../../assets/icons';
import { mergeProps } from '../../utils';

interface useFocusToggleProps {
  props: React.ButtonHTMLAttributes<HTMLButtonElement>;
  trackSource: Track.Source;
  participant?: Participant;
}

function useFocusToggle({ trackSource, participant, props }: useFocusToggleProps) {
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
