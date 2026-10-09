import * as React from 'react';
/** @internal */
export interface FeatureFlags {
    autoSubscription?: boolean;
}
type FeatureContext<T extends boolean = false> = T extends true ? FeatureFlags : FeatureFlags | undefined;
/** @internal */
export declare const LKFeatureContext: React.Context<FeatureFlags | undefined>;
/**
 * @internal
 */
export declare function useFeatureContext<T extends boolean>(require?: T): FeatureContext<T>;
export {};
//# sourceMappingURL=feature-context.d.ts.map