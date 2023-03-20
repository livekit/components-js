/**
 * The TrackReference type is a logical grouping of participant publication and/or subscribed track.
 *
 */

import { Participant, Track, TrackPublication } from 'livekit-client';
// ## TrackReference Types

export type TrackReferenceSubscribed = {
  participant: Participant;
  publication: TrackPublication;
  track: NonNullable<TrackPublication['track']>;
};

export type TrackReferencePublished = {
  participant: Participant;
  publication: TrackPublication;
};

export type TrackReferencePlaceholder = {
  participant: Participant;
  source: Track.Source;
};

export type TrackReference = TrackReferenceSubscribed | TrackReferencePublished;
export type TrackReferenceWithPlaceholder =
  | TrackReferenceSubscribed
  | TrackReferencePublished
  | TrackReferencePlaceholder;

// ### TrackReference Type Predicates
export function isTrackReference(trackReference: unknown): trackReference is TrackReference {
  return (
    isTrackReferenceSubscribed(trackReference as TrackReference) ||
    isTrackReferencePublished(trackReference as TrackReference)
  );
}

function isTrackReferenceSubscribed(
  trackReference: TrackReference,
): trackReference is TrackReferenceSubscribed {
  return trackReference.hasOwnProperty('track');
}

function isTrackReferencePublished(
  trackReference: TrackReference,
): trackReference is TrackReferencePublished {
  return trackReference.hasOwnProperty('publication') && !trackReference.hasOwnProperty('track');
}

export function isTrackReferencePlaceholder(
  trackReference: TrackReferenceWithPlaceholder,
): trackReference is TrackReferencePlaceholder {
  return (
    trackReference.hasOwnProperty('participant') &&
    trackReference.hasOwnProperty('source') &&
    !trackReference.hasOwnProperty('publication') &&
    !trackReference.hasOwnProperty('track')
  );
}
