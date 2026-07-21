import { TrackReferenceOrPlaceholder } from '@livekit/components-core';
import * as React from 'react';
/**
 * This context provides a `TrackReferenceOrPlaceholder` to all child components.
 * @public
 */
export declare const TrackRefContext: React.Context<TrackReferenceOrPlaceholder | undefined>;
/**
 * Ensures that a track reference is provided via context.
 * If not inside a `TrackRefContext`, an error is thrown.
 * @public
 */
export declare function useTrackRefContext(): TrackReferenceOrPlaceholder;
/**
 * Returns a track reference from the `TrackRefContext` if it exists, otherwise `undefined`.
 * @public
 */
export declare function useMaybeTrackRefContext(): TrackReferenceOrPlaceholder | undefined;
/**
 * Ensures that a track reference is provided, either via context or explicitly as a parameter.
 * If not inside a `TrackRefContext` and no track reference is provided, an error is thrown.
 * @public
 */
export declare function useEnsureTrackRef(trackRef?: TrackReferenceOrPlaceholder): TrackReferenceOrPlaceholder;
//# sourceMappingURL=track-reference-context.d.ts.map