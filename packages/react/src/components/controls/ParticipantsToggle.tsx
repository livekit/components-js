import * as React from 'react';
import { useParticipantsToggle } from '../../hooks';

/** @public */
export interface ParticipantsToggleProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

/**
 * The `ParticipantsToggle` component is a button that toggles the visibility of the participants panel.
 * @remarks
 * For the component to have any effect it has to live inside a `LayoutContext` context.
 *
 * @example
 * ```tsx
 * <LiveKitRoom>
 *   <ParticipantsToggle />
 * </LiveKitRoom>
 * ```
 * @public
 */
export const ParticipantsToggle: (
  props: ParticipantsToggleProps & React.RefAttributes<HTMLButtonElement>,
) => React.ReactNode = /* @__PURE__ */ React.forwardRef<HTMLButtonElement, ParticipantsToggleProps>(
  function ParticipantsToggle(props: ParticipantsToggleProps, ref) {
    const { mergedProps } = useParticipantsToggle({ props });

    return (
      <button ref={ref} {...mergedProps}>
        {props.children}
      </button>
    );
  },
);
