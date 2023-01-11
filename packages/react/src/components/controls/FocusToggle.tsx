import { isParticipantTrackPinned, setupFocusToggle } from '@livekit/components-core';
import { Participant, Track } from 'livekit-client';
import * as React from 'react';
import { useEnsureParticipant, useLayoutContext } from '../../context';
import { FocusToggleIcon, UnfocusToggleIcon } from '../../icons';
import { mergeProps } from '../../utils';

interface useFocusToggleProps {
  props: React.HTMLAttributes<HTMLButtonElement>;
  trackSource: Track.Source;
  participant?: Participant;
}

function useFocusToggle({ trackSource, participant, props }: useFocusToggleProps) {
  const p = useEnsureParticipant(participant);
  const { dispatch, state: pinState } = useLayoutContext().pin;
  const { className } = React.useMemo(() => setupFocusToggle(), []);

  const inFocus: boolean = React.useMemo(() => {
    const track = p.getTrack(trackSource);
    if (pinState && track) {
      return isParticipantTrackPinned({ participant: p, track: track }, pinState);
    } else {
      return false;
    }
  }, [p, trackSource, pinState]);

  const mergedProps = React.useMemo(
    () =>
      mergeProps(props, {
        className,
        onClick: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
          // Call user defined on click callbacks.
          props.onClick?.(event);

          // Set or clear focus based on current focus state.
          const track = p.getTrack(trackSource);
          if (dispatch && track) {
            if (inFocus) {
              dispatch({
                msg: 'clear_pin',
              });
            } else {
              dispatch({
                msg: 'set_pin',
                trackParticipantPair: {
                  participant: p,
                  track,
                },
              });
            }
          }
        },
      }),
    [props, className, p, trackSource, dispatch, inFocus],
  );

  return { mergedProps, inFocus };
}
interface FocusToggleProps extends React.HTMLAttributes<HTMLButtonElement> {
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
    <button {...mergedProps}>
      {props.children ? props.children : inFocus ? <UnfocusToggleIcon /> : <FocusToggleIcon />}
    </button>
  );
}
