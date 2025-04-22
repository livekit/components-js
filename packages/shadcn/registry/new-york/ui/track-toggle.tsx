'use client';
import { Video, Mic, MicOff, VideoOff } from 'lucide-react';
import { Toggle } from '@/components/ui/toggle';
import { useTrackToggle } from '@livekit/components-react';
import { Track } from 'livekit-client';

export type TrackToggleProps = React.ComponentProps<typeof Toggle> & {
  source: Track.Source;
};

export function TrackToggle(props: TrackToggleProps) {
  const { enabled, pending, toggle } = useTrackToggle({
    source: props.source,
  });
  const variant = props.variant || 'outline';
  return (
    <Toggle
      variant={variant}
      aria-label={`Toggle ${props.source}`}
      onPressedChange={() => {
        console.log('toggle change');
        toggle();
      }}
      disabled={pending}
      {...props}
    >
      {enabled ? (
        props.source === Track.Source.Microphone ? (
          <Mic />
        ) : (
          <Video />
        )
      ) : props.source === Track.Source.Microphone ? (
        <MicOff />
      ) : (
        <VideoOff />
      )}
      {props.children}
    </Toggle>
  );
}
