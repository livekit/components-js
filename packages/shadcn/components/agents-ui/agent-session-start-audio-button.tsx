import { useEnsureRoom, useStartAudio } from '@livekit/components-react';
import { Button } from '@/components/ui/button';
import { Room } from 'livekit-client';

export interface AgentSessionStartAudioButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  room?: Room;
  label: string;
}

export function AgentSessionStartAudioButton({
  label,
  ...props
}: AgentSessionStartAudioButtonProps) {
  const room = useEnsureRoom(props.room);
  const { mergedProps } = useStartAudio({ room, props });

  return <Button {...mergedProps}>{label}</Button>;
}
