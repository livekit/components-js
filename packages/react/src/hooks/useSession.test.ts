import { act, cleanup, renderHook } from '@testing-library/react';
import { TrackInfo, TrackSource, TrackType } from '@livekit/protocol';
import {
  ConnectionState,
  LocalTrackPublication,
  ParticipantEvent,
  Room,
  RoomEvent,
  TokenSource,
  Track,
} from 'livekit-client';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { useSession } from './useSession';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('useSession local screen share', () => {
  test.each([false, true])(
    'updates the track when screen sharing changes from %s',
    async (initiallySharing) => {
      const room = new Room();
      room.state = ConnectionState.Connected;
      vi.spyOn(room, 'prepareConnection').mockResolvedValue(undefined);
      vi.spyOn(room, 'disconnect').mockResolvedValue(undefined);

      const participant = room.localParticipant;
      const publication = new LocalTrackPublication(
        Track.Kind.Video,
        new TrackInfo({
          sid: 'screen-share',
          name: 'screen-share',
          type: TrackType.VIDEO,
          source: TrackSource.SCREEN_SHARE,
        }),
      );
      if (initiallySharing) {
        participant.trackPublications.set(publication.trackSid, publication);
      }

      const tokenSource = TokenSource.literal({
        serverUrl: 'wss://example.invalid',
        participantToken: 'test-token',
      });
      const { result } = renderHook(() => useSession(tokenSource, { room }));
      const initialCamera = result.current.local.cameraTrack;
      const initialMicrophone = result.current.local.microphoneTrack;
      expect(result.current.local.screenShareTrack?.publication).toBe(
        initiallySharing ? publication : undefined,
      );

      await act(async () => {
        if (initiallySharing) {
          participant.trackPublications.delete(publication.trackSid);
          participant.emit(ParticipantEvent.LocalTrackUnpublished, publication);
        } else {
          participant.trackPublications.set(publication.trackSid, publication);
          participant.emit(ParticipantEvent.LocalTrackPublished, publication);
        }
      });

      expect(result.current.local.screenShareTrack?.publication).toBe(
        initiallySharing ? undefined : publication,
      );
      expect(result.current.local.cameraTrack).toBe(initialCamera);
      expect(result.current.local.microphoneTrack).toBe(initialMicrophone);
      expect(result.current.connectionState).toBe(ConnectionState.Connected);
    },
  );
});

describe('useSession startup cancellation', () => {
  test('late credentials cannot connect after microphone permission failure', async () => {
    const room = new Room();
    Object.defineProperty(room, Symbol.for('livekit.internal.sessionPublication.v1'), {
      value: undefined,
    });
    vi.spyOn(room, 'prepareConnection').mockResolvedValue(undefined);
    vi.spyOn(room, 'disconnect').mockResolvedValue(undefined);
    const connect = vi.spyOn(room, 'connect').mockResolvedValue(undefined);
    vi.spyOn(room.localParticipant, 'setMicrophoneEnabled').mockRejectedValue(
      new Error('permission denied'),
    );
    const credentials = { serverUrl: 'wss://example.invalid', participantToken: 'test-token' };
    let resolve!: (value: typeof credentials) => void;
    const pending = new Promise<typeof credentials>((r) => {
      resolve = r;
    });
    const tokenSource = TokenSource.literal(credentials);
    vi.spyOn(tokenSource, 'fetch').mockReturnValue(pending);
    const { result } = renderHook(() => useSession(tokenSource, { room }));
    const listeners = room.listenerCount(RoomEvent.Disconnected);
    await act(async () => {
      await expect(result.current.start()).rejects.toThrow('permission denied');
      resolve(credentials);
      await Promise.resolve();
    });
    expect(connect).not.toHaveBeenCalled();
    expect(room.listenerCount(RoomEvent.Disconnected)).toBe(listeners);
  });
});
