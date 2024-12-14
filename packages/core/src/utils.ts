import type { Participant, TrackPublication } from 'livekit-client';

import type { TrackReference } from './track-reference';
import { isEqualTrackRef } from './track-reference';
import type { PinState } from './types';

export function isLocal(p: Participant) {
  return p.isLocal;
}

export function isRemote(p: Participant) {
  return !p.isLocal;
}

export const attachIfSubscribed = (
  publication: TrackPublication | undefined,
  element: HTMLMediaElement | null | undefined,
) => {
  if (!publication) return;
  const { isSubscribed, track } = publication;
  if (element && track) {
    if (isSubscribed) {
      track.attach(element);
    } else {
      track.detach(element);
    }
  }
};

/**
 * Check if the participant track reference is pinned.
 */
export function isParticipantTrackReferencePinned(
  trackRef: TrackReference,
  pinState: PinState | undefined,
): boolean {
  if (pinState === undefined) {
    return false;
  }

  return pinState.some((pinnedTrackRef) => isEqualTrackRef(pinnedTrackRef, trackRef));
}

/**
 * Calculates the scrollbar width by creating two HTML elements
 * and messaging the difference.
 * @internal
 */
export function getScrollBarWidth() {
  const inner = document.createElement('p');
  inner.style.width = '100%';
  inner.style.height = '200px';

  const outer = document.createElement('div');
  outer.style.position = 'absolute';
  outer.style.top = '0px';
  outer.style.left = '0px';
  outer.style.visibility = 'hidden';
  outer.style.width = '200px';
  outer.style.height = '150px';
  outer.style.overflow = 'hidden';
  outer.appendChild(inner);

  document.body.appendChild(outer);
  const w1 = inner.offsetWidth;
  outer.style.overflow = 'scroll';
  let w2 = inner.offsetWidth;
  if (w1 === w2) {
    w2 = outer.clientWidth;
  }
  document.body.removeChild(outer);
  const scrollBarWidth = w1 - w2;
  return scrollBarWidth;
}
