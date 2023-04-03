import type { Track } from 'livekit-client';
import type { PinState } from '../types';
import type { TrackReferenceOrPlaceholder } from './track-reference.types';
import { isTrackReference, isTrackReferencePlaceholder } from './track-reference.types';

/** Returns a id to identify the `TrackReference` based on participant and source. */
export function getTrackReferenceId(trackReference: TrackReferenceOrPlaceholder | number): string {
  if (typeof trackReference === 'string' || typeof trackReference === 'number') {
    return `${trackReference}`;
  } else if (isTrackReference(trackReference)) {
    return `${trackReference.participant.identity}_${trackReference.publication.source}`;
  } else {
    return `${trackReference.participant.identity}_${trackReference.source}`;
  }
}

/** Returns the Source of the TrackReference. */
export function getTrackReferenceSource(trackReference: TrackReferenceOrPlaceholder): Track.Source {
  if (isTrackReference(trackReference)) {
    return trackReference.publication.source;
  } else {
    return trackReference.source;
  }
}

export function isEqualTrackRef(
  a?: TrackReferenceOrPlaceholder,
  b?: TrackReferenceOrPlaceholder,
): boolean {
  if (isTrackReference(a) && isTrackReference(b)) {
    return a.publication.trackSid === b.publication.trackSid;
  } else if (isTrackReferencePlaceholder(a) && isTrackReferencePlaceholder(b)) {
    return a.participant.identity === b.participant.identity && a.source === b.source;
  }
  return false;
}

/**
 * Check if the `TrackReference` is pinned.
 */
export function isTrackReferencePinned(
  trackReference: TrackReferenceOrPlaceholder,
  pinState: PinState | undefined,
): boolean {
  if (typeof pinState === 'undefined') {
    return false;
  }
  if (isTrackReference(trackReference)) {
    return pinState.some(
      (pinnedTrackReference) =>
        pinnedTrackReference.participant.identity === trackReference.participant.identity &&
        pinnedTrackReference.publication.trackSid === trackReference.publication.trackSid,
    );
  } else if (isTrackReferencePlaceholder(trackReference)) {
    return pinState.some(
      (pinnedTrackReference) =>
        pinnedTrackReference.participant.identity === trackReference.participant.identity &&
        isTrackReferencePlaceholder(pinnedTrackReference) &&
        pinnedTrackReference.source === trackReference.source,
    );
  } else {
    return false;
  }
}
