import { Track } from 'livekit-client';
import { isTrackReference, TrackReferenceWithPlaceholder } from './track-reference.types';

/** Returns a id to identify a track bundle based on participant and source. */
export function getTrackReferenceId(trackBundle: TrackReferenceWithPlaceholder | number): string {
  if (typeof trackBundle === 'string' || typeof trackBundle === 'number') {
    return `${trackBundle}`;
  } else if (isTrackReference(trackBundle)) {
    return `${trackBundle.participant.identity}_${trackBundle.publication.source}`;
  } else {
    return `${trackBundle.participant.identity}_${trackBundle.source}`;
  }
}

/** Returns the Source of the TrackReference. */
export function getTrackReferenceSource(trackBundle: TrackReferenceWithPlaceholder): Track.Source {
  if (isTrackReference(trackBundle)) {
    return trackBundle.publication.source;
  } else {
    return trackBundle.source;
  }
}
