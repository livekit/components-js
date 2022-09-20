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
    console.log('set up useTrack', pub);
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

export const FocusViewRenderer = (props: FocusViewProps) => {
  const { publication, children, ...htmlProps } = props;
  const videoEl = useRef(null);

  const { track } = useTrack(publication);
  useEffect(() => {
    if (videoEl.current) {
      track?.attach(videoEl.current);
      console.log('attaching focus trak', track);
    }
  }, [videoEl, track]);

  return (
    <>
      <div {...htmlProps}>
        <video
          ref={videoEl}
          style={{
            width: '100%',
            height: '100%',
            display: publication ? 'block' : 'none',
          }}
        ></video>
        {children}
      </div>
    </>
  );
};
