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
export function isTrackReference(bundle: TrackReferenceWithPlaceholder): bundle is TrackReference {
  return (
    isTrackReferenceSubscribed(bundle as TrackReference) ||
    isTrackReferencePublished(bundle as TrackReference)
  );
}

function isTrackReferenceSubscribed(bundle: TrackReference): bundle is TrackReferenceSubscribed {
  return bundle.hasOwnProperty('track');
}

function isTrackReferencePublished(bundle: TrackReference): bundle is TrackReferencePublished {
  return bundle.hasOwnProperty('publication') && !bundle.hasOwnProperty('track');
}

export function isTrackReferencePlaceholder(
  bundle: TrackReferenceWithPlaceholder,
): bundle is TrackReferencePlaceholder {
  return (
    bundle.hasOwnProperty('participant') &&
    bundle.hasOwnProperty('source') &&
    !bundle.hasOwnProperty('publication') &&
    !bundle.hasOwnProperty('track')
  );
}
