import { trackObservable } from '@livekit/components-core';
import { Participant, TrackPublication } from 'livekit-client';
import * as React from 'react';
import { LKComponentAttributes } from '../utils';
// TODO: Does it make sens to have this hook in a file that is called FocusLayoutRenderer but there is now component that renders anything?

// TODO: Is this still needed or can we delete it?
type FocusLayoutProps = LKComponentAttributes<HTMLDivElement> & {
  participant?: Participant;
  publication?: TrackPublication;
};

export function useTrack(pub?: TrackPublication) {
  const [publication, setPublication] = React.useState(pub);
  const [track, setTrack] = React.useState(pub?.track);
  React.useEffect(() => {
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
