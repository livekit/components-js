import * as React from 'react';
import { TileLoop } from '../TileLoop';
import { useParticipants } from '../../hooks';
import { mergeProps } from '../../utils';
import { useSize } from '../../hooks/utiltity-hooks';
import { ParticipantFilter } from '@livekit/components-core';

export interface GridLayoutProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * The grid shows all room participants. If only a subset of the participants
   * should be visible, they can be filtered.
   */
  filter?: ParticipantFilter;
  filterDependencies?: [];
  // TODO maxVisibleParticipants
}

/**
 * The GridLayout component displays the nested participants in a grid where every participants has the same size.
 *
 * @example
 * ```tsx
 * <LiveKitRoom>
 *   <GridLayout />
 * <LiveKitRoom>
 * ```
 */
export function GridLayout({ filter, filterDependencies, ...props }: GridLayoutProps) {
  const participants = useParticipants({ filter, filterDependencies });
  const containerEl = React.createRef<HTMLDivElement>();
  const gridEl = React.createRef<HTMLDivElement>();

  const { width, height } = useSize(containerEl);

  React.useEffect(() => {
    const containerRatio = width / height;
    const tileRatio = 16 / 10;
    const colAdjust = Math.sqrt(containerRatio / tileRatio);
    const colFraction = Math.sqrt(participants.length) * colAdjust;
    const cols = Math.max(participants.length === 1 ? 1 : 2, Math.round(colFraction));
    const widthAdjust = Math.min(100, 100 + (cols > colFraction ? 1 : -1) * (colFraction % 1) * 50);
    if (gridEl.current) {
      gridEl.current.style.setProperty('--lk-col-count', cols.toString());
      gridEl.current.style.width = `${widthAdjust}%`;
    }
  }, [width, height, participants, gridEl.current]);

  const elementProps = React.useMemo(
    () => mergeProps(props, { className: 'lk-grid-layout' }),
    [props],
  );
  return (
    <div ref={containerEl} className="lk-grid-layout-wrapper">
      <div ref={gridEl} {...elementProps}>
        {props.children ?? <TileLoop filter={filter} filterDependencies={filterDependencies} />}
      </div>
    </div>
  );
}
