import { setupParticipantsToggle } from '@livekit/components-core';
import { useLayoutContext } from '../context';
import { mergeProps } from '../mergeProps';
import * as React from 'react';
import { useParticipants } from './useParticipants';

/** @public */
export interface UseParticipantsToggleProps {
  props: React.ButtonHTMLAttributes<HTMLButtonElement>;
}

/**
 * The `useParticipantsToggle` hook provides state and functions for toggling the participants panel.
 * @remarks
 * Depends on the `LayoutContext` to work properly.
 * @public
 */
export function useParticipantsToggle({ props }: UseParticipantsToggleProps) {
  const { dispatch, state } = useLayoutContext().widget;
  const { className } = React.useMemo(() => setupParticipantsToggle(), []);
  const participants = useParticipants();

  const mergedProps = React.useMemo(() => {
    return mergeProps(props, {
      className,
      onClick: () => {
        if (dispatch) dispatch({ msg: 'toggle_participants' });
      },
      'aria-pressed': state?.showParticipants ? 'true' : 'false',
      'data-lk-participant-count': participants.length.toFixed(0),
    });
  }, [props, className, dispatch, state, participants.length]);

  return { mergedProps };
}
