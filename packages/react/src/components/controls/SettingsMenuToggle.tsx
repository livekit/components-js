import * as React from 'react';
import { useSettingsToggle } from '../../hooks/useSettingsToggle';

/** @alpha */
export interface SettingsMenuToggleProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

/**
 * The `SettingsMenuToggle` component is a button that toggles the visibility of the `SettingsMenu` component.
 * @remarks
 * For the component to have any effect it has to live inside a `LayoutContext` context.
 *
 * @alpha
 */
export function SettingsMenuToggle(props: SettingsMenuToggleProps) {
  const { mergedProps } = useSettingsToggle({ props });

  return <button {...mergedProps}>{props.children}</button>;
}
