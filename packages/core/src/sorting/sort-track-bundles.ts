import log from '../logger';
import { TrackBundleWithPlaceholder } from '../types';
import {
  sortParticipantsByAudioLevel,
  sortParticipantsByIsSpeaking,
  sortParticipantsByLastSpokenAT,
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
  trackBundles_.sort(({ participant: a }, { participant: b }) => {
    log.debug('xxx isLocal...');
    if (a.isLocal || b.isLocal) {
      if (a.isLocal) {
        return -1;
      } else {
        return 1;
      }
    }

    log.debug('xxx isSpeaking volume...');
    // loudest speaker first
    if (a.isSpeaking && b.isSpeaking) {
      return sortParticipantsByAudioLevel(a, b);
    }

    log.debug('xxx isSpeaking...');
    // speaker goes first
    if (a.isSpeaking !== b.isSpeaking) {
      return sortParticipantsByIsSpeaking(a, b);
    }

    log.debug('xxx lastSpokeAt...');
    // last active speaker first
    if (a.lastSpokeAt !== b.lastSpokeAt) {
      return sortParticipantsByLastSpokenAT(a, b);
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
