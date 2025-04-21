'use client';
import * as React from 'react';
import { Track, Room } from 'livekit-client';
import { RoomContext } from '@livekit/components-react';

import { DeviceSelect } from '@/registry/new-york/blocks/device-select/device-select';
import { TrackToggle } from '@/registry/new-york/ui/track-toggle';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Chat } from '@/registry/new-york/blocks/chat/chat';
// This page displays items from the custom registry.
// You are free to implement this with your own design as needed.

export default function Home() {
  const [source, setSource] = React.useState<Track.Source>(Track.Source.Microphone);
  const room = React.useMemo(() => new Room(), []);

  React.useEffect(() => {
    if (room.state === 'disconnected') {
      room.connect(
        'wss://lukas-staging.staging.livekit.cloud',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3OTE0MDMzMzgsImlzcyI6IkFQSUFRc3hKRXZtR2Q5ZiIsIm5iZiI6MTY5MTQwMzMzOSwic3ViIjoiZGV2MSIsInZpZGVvIjp7ImNhblB1Ymxpc2giOnRydWUsImNhblB1Ymxpc2hEYXRhIjp0cnVlLCJjYW5TdWJzY3JpYmUiOnRydWUsInJvb20iOiJkZXYiLCJyb29tSm9pbiI6dHJ1ZX19.PcUA1yXZE-emwDhotnii9NmD5qFnf1r70wO-UygOm9k',
      );
    }
    return () => {
      room.disconnect();
    };
  }, [room]);

  return (
    <div className="max-w-3xl mx-auto flex flex-col min-h-svh px-4 py-8 gap-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">Custom Registry</h1>
        <p className="text-muted-foreground">
          A custom registry for distributing code using shadcn.
        </p>
      </header>
      <RoomContext.Provider value={room}>
        <main className="flex flex-col flex-1 gap-8">
          <div className="flex flex-col gap-4 border rounded-lg p-4 min-h-[450px] relative">
            <div className="flex items-center justify-between">
              <h2 className="text-sm text-muted-foreground sm:pl-3">A device select component.</h2>
            </div>
            <div className="flex items-center justify-center min-h-[400px] relative">
              <DeviceSelect kind="audioinput" />
            </div>
          </div>

          <div className="flex flex-col gap-4 border rounded-lg p-4 min-h-[450px] relative">
            <div className="flex items-center justify-between">
              <h2 className="text-sm text-muted-foreground sm:pl-3">A track toggle component.</h2>
              <Select value={source} onValueChange={(value) => setSource(value as Track.Source)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a track" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={Track.Source.Microphone}>Microphone</SelectItem>
                  <SelectItem value={Track.Source.Camera}>Camera</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-center min-h-[400px] relative">
              <TrackToggle source={source} />
            </div>
          </div>

          <div className="flex flex-col gap-4 border rounded-lg p-4 min-h-[450px] relative">
            <div className="flex items-center justify-between">
              <h2 className="text-sm text-muted-foreground sm:pl-3">A chat component.</h2>
            </div>
            <div className="flex items-center justify-center min-h-[400px] relative">
              <Chat />
            </div>
          </div>
        </main>
      </RoomContext.Provider>
    </div>
  );
}
