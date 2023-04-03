/**
 * The TrackReference type is a logical grouping of participant publication and/or subscribed track.
 *
 */

import type { Participant, Track, TrackPublication } from 'livekit-client';
// ## TrackReference Types

export type TrackReferenceSubscribed = {
  participant: Participant;
  publication: TrackPublication;
  track: NonNullable<TrackPublication['track']>;
  source: Track.Source;
};

export type TrackReferencePublished = {
  participant: Participant;
  publication: TrackPublication;
  source: Track.Source;
};

export type TrackReferencePlaceholder = {
  participant: Participant;
  source: Track.Source;
};

export type TrackReference = TrackReferenceSubscribed | TrackReferencePublished;
export type TrackReferenceOrPlaceholder = TrackReference | TrackReferencePlaceholder;

// ### TrackReference Type Predicates
export function isTrackReference(trackReference: unknown): trackReference is TrackReference {
  if (typeof trackReference === 'undefined') {
    return false;
  }
  return isTrackReferenceSubscribed(trackReference) || isTrackReferencePublished(trackReference);
}

function isTrackReferenceSubscribed(
  trackReference: any,
): trackReference is TrackReferenceSubscribed {
  if (!trackReference) {
    return false;
  }
  return (
    trackReference.hasOwnProperty('participant') &&
    trackReference.hasOwnProperty('source') &&
    trackReference.hasOwnProperty('track') &&
    typeof trackReference.track !== 'undefined'
  );
}

function isTrackReferencePublished(trackReference: any): trackReference is TrackReferencePublished {
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
  trackReference: any,
): trackReference is TrackReferencePlaceholder {
  if (!trackReference) {
    return false;
  }
  return (
    trackReference.hasOwnProperty('participant') &&
    trackReference.hasOwnProperty('source') &&
    typeof trackReference.publication !== 'undefined' &&
    typeof trackReference.track !== 'undefined'
  );
}
