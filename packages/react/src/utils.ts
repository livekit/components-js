import { Participant, TrackPublication, LocalParticipant } from 'livekit-client';
import React, { HTMLAttributes, useEffect, useState } from 'react';
import { mergeProps as mergePropsReactAria } from 'react-aria';
import { Observable } from 'rxjs';

interface LKEnhanceProps {
  participant?: Participant;
  publication?: TrackPublication;
}

interface LKMouseEvent<T extends HTMLElement> extends React.MouseEvent<T>, LKEnhanceProps {}

type LKComponentAttributes<T extends HTMLElement> = HTMLAttributes<T> & {};

function isProp<U extends HTMLElement, T extends LKComponentAttributes<U>>(
  prop: T | undefined,
): prop is T {
  return prop !== undefined;
}

function mergeProps<U extends HTMLElement, T extends Array<LKComponentAttributes<U> | undefined>>(
  ...props: T
) {
  return mergePropsReactAria(...props.filter(isProp));
}

function enhanceProps<T extends HTMLElement>(
  props: LKComponentAttributes<T>,
  enhanced: LKEnhanceProps,
) {
  if (props.onClick) {
    props.onClick = (evt: LKMouseEvent<T>) => {
      evt.participant = enhanced.participant;
      evt.publication = enhanced.publication;
      props.onClick?.(evt);
    };
  }
}

function useObservableState<T>(
  observable: Observable<T>,
  startWith: T,
  dependencies: Array<any> = [observable],
) {
  const [state, setState] = useState<T>(startWith);
  useEffect(() => {
    const subscription = observable.subscribe(setState);
    return () => subscription.unsubscribe();
  }, dependencies);
  return state;
}

/**
 * Default sort for participants, it'll order participants by:
 * 1. dominant speaker (speaker with the loudest audio level)
 * 2. local participant
 * 3. other speakers that are recently active
 * 4. participants with video on
 * 5. by joinedAt
 */
function sortParticipantsByVolume(participants: Participant[]): Participant[] {
  const sortedParticipants = [...participants];
  sortedParticipants.sort((a, b) => {
    // loudest speaker first
    if (a.isSpeaking && b.isSpeaking) {
      return b.audioLevel - a.audioLevel;
    }

    // speaker goes first
    if (a.isSpeaking !== b.isSpeaking) {
      if (a.isSpeaking) {
        return -1;
      } else {
        return 1;
      }
    }

    // last active speaker first
    if (a.lastSpokeAt !== b.lastSpokeAt) {
      const aLast = a.lastSpokeAt?.getTime() ?? 0;
      const bLast = b.lastSpokeAt?.getTime() ?? 0;
      return bLast - aLast;
    }

    // video on
    const aVideo = a.videoTracks.size > 0;
    const bVideo = b.videoTracks.size > 0;
    if (aVideo !== bVideo) {
      if (aVideo) {
        return -1;
      } else {
        return 1;
      }
    }

    // joinedAt
    return (a.joinedAt?.getTime() ?? 0) - (b.joinedAt?.getTime() ?? 0);
  });
  const localParticipant = sortedParticipants.find((p) => p instanceof LocalParticipant);
  if (localParticipant) {
    const localIdx = sortedParticipants.indexOf(localParticipant);
    if (localIdx >= 0) {
      sortedParticipants.splice(localIdx, 1);
      if (sortedParticipants.length > 0) {
        sortedParticipants.splice(1, 0, localParticipant);
      } else {
        sortedParticipants.push(localParticipant);
      }
    }
  }
  return sortedParticipants;
}

export {
  mergeProps,
  enhanceProps,
  LKComponentAttributes,
  LKMouseEvent,
  useObservableState,
  sortParticipantsByVolume,
};
