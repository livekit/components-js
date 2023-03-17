import { Track } from 'livekit-client';
import { isTrackReference, TrackReferenceWithPlaceholder } from './track-reference.types';

/** Returns a id to identify the `TrackReference` based on participant and source. */
export function getTrackReferenceId(
  trackReference: TrackReferenceWithPlaceholder | number,
): string {
  if (typeof trackReference === 'string' || typeof trackReference === 'number') {
    return `${trackReference}`;
  } else if (isTrackReference(trackReference)) {
    return `${trackReference.participant.identity}_${trackReference.publication.source}`;
  } else {
    return `${trackReference.participant.identity}_${trackReference.source}`;
  }
}

/** Returns the Source of the TrackReference. */
export function getTrackReferenceSource(
  trackReference: TrackReferenceWithPlaceholder,
): Track.Source {
  if (isTrackReference(trackReference)) {
    return trackReference.publication.source;
  } else {
    return trackReference.source;
  }
}
