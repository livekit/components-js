import * as React from 'react';
import { mergeProps } from '../../utils';
import { getConnectionQualityIcon } from '../../assets/icons/util';
import type { ConnectionQualityIndicatorOptions } from '../../hooks';
import { useConnectionQualityIndicator } from '../../hooks';

/** @public */
export interface ConnectionQualityIndicatorProps
  extends React.HTMLAttributes<HTMLDivElement>,
    ConnectionQualityIndicatorOptions {}

/**
 * The ConnectionQualityIndicator shows the individual connection quality of a participant.
 *
 * @example
 * ```tsx
 * <ConnectionQualityIndicator />
 * ```
 * @public
 */
export function ConnectionQualityIndicator(props: ConnectionQualityIndicatorProps) {
  const { className, quality } = useConnectionQualityIndicator(props);
  const elementProps = React.useMemo(() => {
    return { ...mergeProps(props, { className: className as string }), 'data-lk-quality': quality };
  }, [quality, props, className]);
  return <div {...elementProps}>{props.children ?? getConnectionQualityIcon(quality)}</div>;
}
