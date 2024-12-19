/**
 * Used to merge the exports from the main index.ts file with the exports from the cloud/krisp/useKrispNoiseFilter.ts file for docs generation.
 */

// Regular exports
export * from './index';

// Cloud/Krisp exports
export {
  useKrispNoiseFilter,
  type useKrispNoiseFilterOptions,
} from './hooks/cloud/krisp/useKrispNoiseFilter';
