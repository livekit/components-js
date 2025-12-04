import { RoomAudioRenderer, type RoomAudioRendererProps } from '@livekit/components-react';

export type AgentSessionAudioProps = Pick<RoomAudioRendererProps, 'volume' | 'muted'>;

export function AgentSessionAudio(props: AgentSessionAudioProps) {
  return <RoomAudioRenderer {...props} />;
}
