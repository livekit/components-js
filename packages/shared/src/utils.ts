import type { ClassNames } from '@livekit/components-styles/dist/types/styles.css';
import type { UnprefixedClassNames } from '@livekit/components-styles/dist/types_unprefixed/styles.scss';
import { LocalParticipant, Participant, RemoteParticipant, TrackPublication } from 'livekit-client';
import { cssPrefix } from './constants';
export const kebabize = (str: string) =>
  str.replace(/[A-Z]+(?![a-z])|[A-Z]/g, ($, ofs) => (ofs ? '-' : '') + $.toLowerCase());

/**
 * Converts a non prefixed CSS class into a prefixed one.
 */
export function lkClassName(unprefixedClassName: UnprefixedClassNames): ClassNames {
  return `${cssPrefix}-${unprefixedClassName}`;
}

export const isLocal = (p: Participant) => p instanceof LocalParticipant;

export const isRemote = (p: Participant) => p instanceof RemoteParticipant;

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
