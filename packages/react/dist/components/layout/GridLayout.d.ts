import { UseParticipantsOptions } from '../../hooks';
import { TrackReferenceOrPlaceholder } from '@livekit/components-core';
import * as React from 'react';
/** @public */
export interface GridLayoutProps extends React.HTMLAttributes<HTMLDivElement>, Pick<UseParticipantsOptions, 'updateOnlyOn'> {
    children: React.ReactNode;
    tracks: TrackReferenceOrPlaceholder[];
}
/**
 * The `GridLayout` component displays the nested participants in a grid where every participants has the same size.
 * It also supports pagination if there are more participants than the grid can display.
 * @remarks
 * To ensure visual stability when tiles are reordered due to track updates,
 * the component uses the `useVisualStableUpdate` hook.
 * @example
 * ```tsx
 * <LiveKitRoom>
 *   <GridLayout tracks={tracks}>
 *     <ParticipantTile />
 *   </GridLayout>
 * <LiveKitRoom>
 * ```
 * @public
 */
export declare function GridLayout({ tracks, ...props }: GridLayoutProps): React.JSX.Element;
//# sourceMappingURL=GridLayout.d.ts.map