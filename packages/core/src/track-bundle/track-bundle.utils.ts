import { Track } from 'livekit-client';
import { isTrackBundle, TrackBundleWithPlaceholder } from './track-bundle.types';

/** Returns a id to identify a track bundle based on participant and source. */
export function getTrackBundleId(trackBundle: TrackBundleWithPlaceholder | number): string {
  if (typeof trackBundle === 'string' || typeof trackBundle === 'number') {
    return `${trackBundle}`;
  } else if (isTrackBundle(trackBundle)) {
    return `${trackBundle.participant.identity}_${trackBundle.publication.source}`;
  } else {
    return `${trackBundle.participant.identity}_${trackBundle.source}`;
  }
}

/** Returns the Source of the TrackBundle. */
export function getTrackBundleSource(trackBundle: TrackBundleWithPlaceholder): Track.Source {
  if (isTrackBundle(trackBundle)) {
    return trackBundle.publication.source;
  } else {
    return trackBundle.source;
  }
}
