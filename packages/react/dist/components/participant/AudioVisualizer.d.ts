import { TrackReference } from '@livekit/components-core';
import * as React from 'react';
/**
 * @public
 * @deprecated Use BarVisualizer instead
 */
export interface AudioVisualizerProps extends React.HTMLAttributes<SVGElement> {
    trackRef?: TrackReference;
}
/**
 * The AudioVisualizer component is used to visualize the audio volume of a given audio track.
 * @remarks
 * Requires a `TrackReferenceOrPlaceholder` to be provided either as a property or via the `TrackRefContext`.
 * @example
 * ```tsx
 * <AudioVisualizer />
 * ```
 * @public
 * @deprecated Use BarVisualizer instead
 */
export declare const AudioVisualizer: (props: AudioVisualizerProps & React.RefAttributes<SVGSVGElement>) => React.ReactNode;
//# sourceMappingURL=AudioVisualizer.d.ts.map