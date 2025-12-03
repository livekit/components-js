'use client';

import { type HTMLAttributes, useMemo, useState } from 'react';
import { Track } from 'livekit-client';
import { motion } from 'motion/react';
import { useChat, useRemoteParticipants } from '@livekit/components-react';
import { MessageSquareTextIcon } from 'lucide-react';
import {
  AgentTrackToggle,
  agentTrackToggleVariants,
} from '@/components/agents-ui/agent-track-toggle';
import { AgentTrackControl } from '@/components/agents-ui/agent-track-control';
import { Toggle } from '@/components/ui/toggle';
import { cn } from '@/lib/utils';
import { AgentChatInput } from './agent-chat-input';
import { UseInputControlsProps, useInputControls } from './hooks/use-input-controls';
import { usePublishPermissions } from './hooks/use-publish-permissions';
import { AgentDisconnectButton } from '../agent-disconnect-button';

const MOTION_PROPS = {
  variants: {
    hidden: {
      height: 0,
      opacity: 0,
      marginBottom: 0,
    },
    visible: {
      height: 'auto',
      opacity: 1,
      marginBottom: 12,
    },
  },
  initial: 'hidden',
  transition: {
    duration: 0.3,
    ease: 'easeOut',
  },
};

export interface ControlBarControls {
  leave?: boolean;
  camera?: boolean;
  microphone?: boolean;
  screenShare?: boolean;
  chat?: boolean;
}

export interface AgentControlBarProps extends UseInputControlsProps {
  controls?: ControlBarControls;
  isConnected?: boolean;
  isChatOpen?: boolean;
  onIsChatOpenChange?: (open: boolean) => void;
  onDeviceError?: (error: { source: Track.Source; error: Error }) => void;
}

/**
 * A control bar specifically designed for voice assistant interfaces
 */
export function AgentControlBar({
  controls,
  saveUserChoices = true,
  className,
  isConnected = false,
  isChatOpen = false,
  onDisconnect,
  onDeviceError,
  onIsChatOpenChange,
  ...props
}: AgentControlBarProps & HTMLAttributes<HTMLDivElement>) {
  const { send } = useChat();
  const participants = useRemoteParticipants();
  const publishPermissions = usePublishPermissions();
  const [isChatOpenUncontrolled, setIsChatOpenUncontrolled] = useState(isChatOpen);
  const {
    micTrackRef,
    cameraToggle,
    microphoneToggle,
    screenShareToggle,
    handleAudioDeviceChange,
    handleVideoDeviceChange,
    handleMicrophoneDeviceSelectError,
    handleCameraDeviceSelectError,
  } = useInputControls({ onDeviceError, saveUserChoices });

  const handleSendMessage = async (message: string) => {
    await send(message);
  };

  const visibleControls = {
    leave: controls?.leave ?? true,
    microphone: controls?.microphone ?? publishPermissions.microphone,
    screenShare: controls?.screenShare ?? publishPermissions.screenShare,
    camera: controls?.camera ?? publishPermissions.camera,
    chat: controls?.chat ?? publishPermissions.data,
  };

  const isAgentAvailable = useMemo(() => participants.some((p) => p.isAgent), [participants]);

  return (
    <div
      aria-label="Voice assistant controls"
      className={cn(
        'bg-background border-input/50 dark:border-muted flex flex-col rounded-[31px] border p-3 drop-shadow-md/3',
        className,
      )}
      {...props}
    >
      {/* Chat Input */}
      {visibleControls.chat && (
        <motion.div
          {...MOTION_PROPS}
          // @ts-ignore
          inert={!(isChatOpen || isChatOpenUncontrolled)}
          animate={isChatOpen || isChatOpenUncontrolled ? 'visible' : 'hidden'}
          className="border-input/50 flex w-full items-start overflow-hidden border-b"
        >
          <AgentChatInput
            chatOpen={isChatOpen || isChatOpenUncontrolled}
            isAgentAvailable={isAgentAvailable}
            onSend={handleSendMessage}
          />
        </motion.div>
      )}

      <div className="flex gap-1">
        <div className="flex grow gap-1">
          {/* Toggle Microphone */}
          {visibleControls.microphone && (
            <AgentTrackControl
              kind="audioinput"
              aria-label="Toggle microphone"
              source={Track.Source.Microphone}
              pressed={microphoneToggle.enabled}
              disabled={microphoneToggle.pending}
              audioTrackRef={micTrackRef}
              onPressedChange={microphoneToggle.toggle}
              onActiveDeviceChange={handleAudioDeviceChange}
              onMediaDeviceError={handleMicrophoneDeviceSelectError}
              className="[&_button:first-child]:rounded-l-full [&_button:last-child]:rounded-r-full"
            />
          )}

          {/* Toggle Camera */}
          {visibleControls.camera && (
            <AgentTrackControl
              kind="videoinput"
              aria-label="Toggle camera"
              source={Track.Source.Camera}
              pressed={cameraToggle.enabled}
              pending={cameraToggle.pending}
              disabled={cameraToggle.pending}
              onPressedChange={cameraToggle.toggle}
              onMediaDeviceError={handleCameraDeviceSelectError}
              onActiveDeviceChange={handleVideoDeviceChange}
              className="[&_button:first-child]:rounded-l-full [&_button:last-child]:rounded-r-full"
            />
          )}

          {/* Toggle Screen Share */}
          {visibleControls.screenShare && (
            <AgentTrackToggle
              variant="secondary"
              aria-label="Toggle screen share"
              source={Track.Source.ScreenShare}
              pressed={screenShareToggle.enabled}
              disabled={screenShareToggle.pending}
              onPressedChange={screenShareToggle.toggle}
              className="rounded-full"
            />
          )}

          {/* Toggle Transcript */}
          <Toggle
            pressed={isChatOpen || isChatOpenUncontrolled}
            aria-label="Toggle transcript"
            onPressedChange={(state) => {
              if (!onIsChatOpenChange) setIsChatOpenUncontrolled(state);
              else onIsChatOpenChange(state);
            }}
            className={agentTrackToggleVariants({
              variant: 'secondary',
              className: 'rounded-full',
            })}
          >
            <MessageSquareTextIcon />
          </Toggle>
        </div>

        {/* Disconnect */}
        {visibleControls.leave && (
          <AgentDisconnectButton
            onClick={onDisconnect}
            disabled={!isConnected}
            className="bg-destructive/10 dark:bg-destructive/10 text-destructive hover:bg-destructive/20 dark:hover:bg-destructive/20 focus:bg-destructive/20 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/4 rounded-full font-mono text-xs font-bold tracking-wider"
          >
            <span className="hidden md:inline">END CALL</span>
            <span className="inline md:hidden">END</span>
          </AgentDisconnectButton>
        )}
      </div>
    </div>
  );
}
