import { KrispNoiseFilterProcessor, NoiseFilterOptions } from '@livekit/krisp-noise-filter';
import { TrackReferenceOrPlaceholder } from '@livekit/components-core';
/**
 * @beta
 */
export interface useKrispNoiseFilterOptions {
    /**
     * The track reference to use for the noise filter (defaults: local microphone track)
     */
    trackRef?: TrackReferenceOrPlaceholder;
    /**
     * @internal
     */
    filterOptions?: NoiseFilterOptions;
}
/**
 * Enable the Krisp enhanced noise cancellation feature for local audio tracks.
 *
 * Defaults to the localParticipant's microphone track publication, but you can override this behavior by passing in a different track reference.
 *
 * @package \@livekit/components-react/krisp
 * @remarks This filter requires that you install the `@livekit/krisp-noise-filter` package and is supported only on {@link https://cloud.livekit.io | LiveKit Cloud}.
 * @beta
 * @example
 * ```tsx
 * const krisp = useKrispNoiseFilter();
 * return <input
 *   type="checkbox"
 *   onChange={(ev) => krisp.setNoiseFilterEnabled(ev.target.checked)}
 *   checked={krisp.isNoiseFilterEnabled}
 *   disabled={krisp.isNoiseFilterPending}
 * />
 * ```
 * @returns Use `setIsNoiseFilterEnabled` to enable/disable the noise filter.
 */
export declare function useKrispNoiseFilter(options?: useKrispNoiseFilterOptions): {
    setNoiseFilterEnabled: (enable: boolean) => Promise<void>;
    isNoiseFilterEnabled: boolean;
    isNoiseFilterPending: boolean;
    processor: KrispNoiseFilterProcessor | undefined;
};
//# sourceMappingURL=useKrispNoiseFilter.d.ts.map