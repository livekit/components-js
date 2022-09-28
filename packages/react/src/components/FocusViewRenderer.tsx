import { trackObservable } from '@livekit/components-core';
import { Participant, TrackPublication } from 'livekit-client';
import React, { useEffect, useRef, useState } from 'react';
import { LKComponentAttributes } from '../utils';

type FocusViewProps = LKComponentAttributes<HTMLDivElement> & {
  participant?: Participant;
  publication?: TrackPublication;
};

export function useTrack(pub?: TrackPublication) {
  const [publication, setPublication] = useState(pub);
  const [track, setTrack] = useState(pub?.track);
  useEffect(() => {
    if (!pub) return;
    const listener = trackObservable(pub).subscribe((p) => {
      if (p.track !== track) {
        track?.detach();
      }
      setPublication(p);
      setTrack(p.isSubscribed ? p.track : undefined);
    });
    setTrack(pub?.track);
    setPublication(pub);
    return () => listener.unsubscribe();
  }, [pub]);

  return { publication, track };
}
