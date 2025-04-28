'use client';

import * as React from 'react';
import { Track } from 'livekit-client';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { TrackToggle } from '../../ui/track-toggle';
import { DeviceSelect } from '../device-select/device-select';
import { BarVisualizer } from '@livekit/components-react';
import { cn } from '@/lib/utils';
import { useVoiceAssistantControlBar } from './hooks/use-voice-assistant-control-bar';

export interface VoiceAssistantControlBarProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Controls which UI elements to show */
  controls?: {
    microphone?: boolean;
    leave?: boolean;
  };
  /**
   * If `true`, the user's device choices will be persisted.
   * This will enables the user to have the same device choices when they rejoin the room.
   */
  saveUserChoices?: boolean;
  /** Callback for device errors */
  onDeviceError?: (error: { source: Track.Source; error: Error }) => void;
}

/**
 * A control bar specifically designed for voice assistant interfaces
 */
export function VoiceAssistantControlBar({
  controls,
  saveUserChoices = true,
  onDeviceError,
  className,
  ...props
}: VoiceAssistantControlBarProps) {
  const {
    visibleControls,
    micTrackRef,
    microphoneOnChange,
    handleDisconnect,
    handleDeviceChange,
    handleError,
  } = useVoiceAssistantControlBar({
    controls,
    saveUserChoices,
    onDeviceError,
  });

  return (
    <div
      className={cn('flex w-full rounded-md bg-background p-2.5 shadow-sm', className)}
      aria-label="Voice assistant controls"
      {...props}
    >
      {visibleControls.microphone && (
        <div className="flex items-center gap-0">
          <TrackToggle
            className="border-r-0 rounded-r-none relative w-auto"
            source={Track.Source.Microphone}
          >
            <BarVisualizer
              className="w-auto h-full flex gap-0.5 items-center justify-center"
              trackRef={micTrackRef}
              barCount={5}
              options={{ minHeight: 5 }}
            >
              <span className="w-1 h-full data-lk-highlighted:bg-foreground data-lk-muted:bg-muted origin-center rounded-2xl"></span>
            </BarVisualizer>
          </TrackToggle>
          <DeviceSelect
            className="border-l-0 rounded-l-none"
            variant="small"
            kind="audioinput"
            onActiveDeviceChange={handleDeviceChange}
            onError={handleError}
          />
        </div>
      )}

      {visibleControls.leave && (
        <>
          <div className="mx-2.5 w-px bg-border" />
          <Button variant="destructive" size="sm" onClick={handleDisconnect} className="ml-auto">
            <LogOut className="mr-1 h-4 w-4" />
            Disconnect
          </Button>
        </>
      )}
    </div>
  );
}
