import * as React from 'react';

/** @alpha */
export interface FeatureFlags {
  autoSubscription?: boolean;
}

type FeatureContext<T extends boolean = false> = T extends true
  ? FeatureFlags
  : FeatureFlags | undefined;

/** @alpha */
export const LKFeatureContext = React.createContext<FeatureFlags | undefined>(undefined);

/**
 * @alpha
 */
export function useFeatureContext<T extends boolean>(require?: T): FeatureContext<T> {
  const ctx = React.useContext(LKFeatureContext) as FeatureContext<T>;
  if (require === true) {
    if (ctx) {
      return ctx;
    } else {
      throw Error('tried to access feature context, but none is present');
    }
  }
  return ctx;
}
