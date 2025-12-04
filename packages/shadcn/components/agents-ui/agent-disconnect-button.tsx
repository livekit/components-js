'use client';

import { Button, buttonVariants } from '@/components/ui/button';
import { useSessionContext } from '@livekit/components-react';
import { type VariantProps } from 'class-variance-authority';
import { PhoneOffIcon } from 'lucide-react';

export interface AgentDisconnectButtonProps
  extends React.ComponentProps<'button'>,
    VariantProps<typeof buttonVariants> {
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

export function AgentDisconnectButton({
  icon,
  children,
  onClick,
  ...props
}: AgentDisconnectButtonProps) {
  const { end } = useSessionContext();
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(event);
    end();
  };

  return (
    <Button variant="destructive" onClick={handleClick} {...props}>
      {icon ?? <PhoneOffIcon />}
      {children ?? <span>END CALL</span>}
    </Button>
  );
}
