import { trackObservable } from '@livekit/components-core';
import { Participant, TrackPublication } from 'livekit-client';
import { useEffect, useState } from 'react';
import { LKComponentAttributes } from '../utils';
// TODO: Does it make sens to have this hook in a file that is called FocusViewRenderer but there is now component that renders anything?

// TODO: Is this still needed or can we delete it?
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
  }, [pub, track]);

  return { publication, track };
}
