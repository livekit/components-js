/**
 * The TrackReference type is a logical grouping of participant publication and/or subscribed track.
 *
 */

import type { Participant, Track, TrackPublication } from 'livekit-client';
// ## TrackReference Types

/** @public */
export type TrackReferencePlaceholder<TrackSource extends Track.Source = Track.Source, P = Participant> = {
  participant: P;
  publication?: never;
  source: TrackSource;
};

/** @public */
export type TrackReference<TrackSource extends Track.Source = Track.Source, P = Participant> = {
  participant: P;
  publication: TrackPublication;
  source: TrackSource;
};

/** @public */
export type TrackReferenceOrPlaceholder<
  TrackSource extends Track.Source = Track.Source,
  P = Participant,
> = TrackReference<TrackSource, P> | TrackReferencePlaceholder<TrackSource, P>;

// ### TrackReference Type Predicates
/** @internal */
export function isTrackReference(trackReference: unknown): trackReference is TrackReference {
  if (typeof trackReference === 'undefined') {
    return false;
  }
  return (
    isTrackReferenceSubscribed(trackReference as TrackReference) ||
    isTrackReferencePublished(trackReference as TrackReference)
  );
}

function isTrackReferenceSubscribed(trackReference?: TrackReferenceOrPlaceholder): boolean {
  if (!trackReference) {
    return false;
  }
  return (
    trackReference.hasOwnProperty('participant') &&
    trackReference.hasOwnProperty('source') &&
    trackReference.hasOwnProperty('track') &&
    typeof trackReference.publication?.track !== 'undefined'
  );
}

function isTrackReferencePublished(trackReference?: TrackReferenceOrPlaceholder): boolean {
  if (!trackReference) {
    return false;
  }
  return (
    trackReference.hasOwnProperty('participant') &&
    trackReference.hasOwnProperty('source') &&
    trackReference.hasOwnProperty('publication') &&
    typeof trackReference.publication !== 'undefined'
  );
}

export function isTrackReferencePlaceholder(
  trackReference?: TrackReferenceOrPlaceholder,
): trackReference is TrackReferencePlaceholder {
  if (!trackReference) {
    return false;
  }
  return (
    trackReference.hasOwnProperty('participant') &&
    trackReference.hasOwnProperty('source') &&
    typeof trackReference.publication === 'undefined'
  );
}
