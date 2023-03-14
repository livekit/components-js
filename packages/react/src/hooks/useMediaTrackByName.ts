import { useMediaTrackBySourceOrName, UseMediaTrackOptions } from './useMediaTrackBySourceOrName';

export function useMediaTrackByName(name: string, options: UseMediaTrackOptions = {}) {
  return useMediaTrackBySourceOrName({ name }, options);
}
