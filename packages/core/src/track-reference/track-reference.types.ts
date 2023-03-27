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
  if (!trackReference) {
    return false;
  }
  return isTrackReferenceSubscribed(trackReference) || isTrackReferencePublished(trackReference);
}

function isTrackReferenceSubscribed(
  trackReference: unknown,
): trackReference is TrackReferenceSubscribed {
  if (!trackReference) {
    return false;
  }
  return (
    trackReference.hasOwnProperty('participant') &&
    trackReference.hasOwnProperty('source') &&
    trackReference.hasOwnProperty('track') &&
    // @ts-ignore

    trackReference.track
  );
}

function isTrackReferencePublished(
  trackReference: unknown,
): trackReference is TrackReferencePublished {
  if (!trackReference) {
    return false;
  }
  return (
    trackReference.hasOwnProperty('participant') &&
    trackReference.hasOwnProperty('source') &&
    trackReference.hasOwnProperty('publication') &&
    // @ts-ignore
    !trackReference.track
  );
}

export function isTrackReferencePlaceholder(
  trackReference: unknown,
): trackReference is TrackReferencePlaceholder {
  if (!trackReference) {
    return false;
  }
  return (
    trackReference.hasOwnProperty('participant') &&
    trackReference.hasOwnProperty('source') &&
    // @ts-ignore
    !trackReference.publication &&
    // @ts-ignore
    !trackReference.track
  );
}
