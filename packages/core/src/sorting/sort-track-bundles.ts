import log from '../logger';
import { isTrackBundle, TrackBundleWithPlaceholder } from '../track-bundle';
import {
  sortParticipantsByAudioLevel,
  sortParticipantsByIsSpeaking,
  sortParticipantsByLastSpokenAT,
  sortTrackBundlesByType,
} from './base-sort-functions';

/**
 *
 *
 * Default sort for TrackParticipantPairs, it'll order participants by:
 * 1. local camera track (publication.isLocal)
 * 2. remote screen_share track
 * 3. local screen_share track
 * 4. remote dominant speaker camera track (sorted by speaker with the loudest audio level)
 * 5. other remote speakers that are recently active
 * 6. remote unmuted camera tracks
 * 7. remote unmuted microphone tracks
 * 8. remote tracks sorted by joinedAt
 */
export function sortTrackBundles(
  trackBundles: TrackBundleWithPlaceholder[],
): TrackBundleWithPlaceholder[] {
  const trackBundles_ = [...trackBundles];
  log.debug('xxx sorting...');
  trackBundles_.sort((a, b) => {
    log.debug('xxx isLocal...');
    if (a.participant.isLocal || b.participant.isLocal) {
      if (a.participant.isLocal) {
        return -1;
      } else {
        return 1;
      }
    }

    log.debug('xxx isSpeaking volume...');
    // loudest speaker first
    if (a.participant.isSpeaking && b.participant.isSpeaking) {
      return sortParticipantsByAudioLevel(a.participant, b.participant);
    }

    log.debug('xxx isSpeaking...');
    // speaker goes first
    if (a.participant.isSpeaking !== b.participant.isSpeaking) {
      return sortParticipantsByIsSpeaking(a.participant, b.participant);
    }

    log.debug('xxx lastSpokeAt...');
    // last active speaker first
    if (a.participant.lastSpokeAt !== b.participant.lastSpokeAt) {
      return sortParticipantsByLastSpokenAT(a.participant, b.participant);
    }

    if (isTrackBundle(a) !== isTrackBundle(b)) {
      return sortTrackBundlesByType(a, b);
    }

    // video on
    // const aVideo = a.videoTracks.size > 0;
    // const bVideo = b.videoTracks.size > 0;
    // if (aVideo !== bVideo) {
    //   if (aVideo) {
    //     return -1;
    //   } else {
    //     return 1;
    //   }
    // }

    // joinedAt
    // return (a.joinedAt?.getTime() ?? 0) - (b.joinedAt?.getTime() ?? 0);
    log.debug('xxx This should never happen 😬');
    return 0;
  });
  return trackBundles_;
}
