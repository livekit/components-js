import * as React from 'react';
import { mergeProps } from '../utils';

/**
 * The `Toast` component is a rudimentary way to display a message to the user.
 * This message should be short lived and not require user interaction.
 * For example, displaying the current connection state like `ConnectionStateToast` does.
 *
 * @example
 * ```tsx
 * <Toast>Connecting...</Toast>
 * ```
 * @public
 */
export function Toast(props: React.HTMLAttributes<HTMLDivElement>) {
  const htmlProps = React.useMemo(() => mergeProps(props, { className: 'lk-toast' }), [props]);
  return <div {...htmlProps}>{props.children}</div>;
}
