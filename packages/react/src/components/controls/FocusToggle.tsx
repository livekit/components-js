import { isTrackReferencePinned, setupFocusToggle, trackReference } from '@livekit/components-core';
import type { Participant, Track } from 'livekit-client';
import * as React from 'react';
import { LayoutContext, useEnsureTrackReference, useMaybeLayoutContext } from '../../context';
import { FocusToggleIcon, UnfocusToggleIcon } from '../../assets/icons';
import { mergeProps } from '../../utils';

interface useFocusToggleProps {
  props: React.ButtonHTMLAttributes<HTMLButtonElement>;
  trackSource: Track.Source;
  participant?: Participant;
}

function useFocusToggle({ trackSource, participant, props }: useFocusToggleProps) {
  const maybeTrackRef = participant ? trackReference(participant, trackSource) : undefined;
  const trackRef = useEnsureTrackReference(maybeTrackRef);
  const layoutContext = useMaybeLayoutContext();
  const { className } = React.useMemo(() => setupFocusToggle(), []);

  const inFocus: boolean = React.useMemo(() => {
    const track = trackRef.participant.getTrack(trackSource);
    if (layoutContext?.pin.state && track) {
      return isTrackReferencePinned(
        { participant: trackRef.participant, source: trackSource, publication: track },
        layoutContext.pin.state,
      );
    } else {
      return false;
    }
  }, [trackRef.participant, trackSource, layoutContext]);

  const mergedProps = React.useMemo(
    () =>
      mergeProps(props, {
        className,
        onClick: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
          // Call user defined on click callbacks.
          props.onClick?.(event);

          // Set or clear focus based on current focus state.
          const track = trackRef.participant.getTrack(trackSource);
          if (layoutContext?.pin.dispatch && track) {
            if (inFocus) {
              layoutContext.pin.dispatch({
                msg: 'clear_pin',
              });
            } else {
              layoutContext.pin.dispatch({
                msg: 'set_pin',
                trackReference: {
                  participant: trackRef.participant,
                  publication: track,
                  source: track.source,
                },
              });
            }
          }
        },
      }),
    [props, className, trackRef.participant, trackSource, inFocus, layoutContext],
  );

  return { mergedProps, inFocus };
}
interface FocusToggleProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
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
