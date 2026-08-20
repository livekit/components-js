import { Participant } from 'livekit-client';
/** @public */
export interface ConnectionQualityIndicatorOptions {
    participant?: Participant;
}
/**
 * The `useConnectionQualityIndicator` hook provides props for the `ConnectionQualityIndicator` or your custom implementation of it component.
 * @example
 * ```tsx
 * const { quality } = useConnectionQualityIndicator();
 * // or
 * const { quality } = useConnectionQualityIndicator({ participant });
 * ```
 * @public
 */
export declare function useConnectionQualityIndicator(options?: ConnectionQualityIndicatorOptions): {
    className: `lk-${string}`;
    quality: import('livekit-client').ConnectionQuality;
};
//# sourceMappingURL=useConnectionQualityIndicator.d.ts.map