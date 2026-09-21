import { act, cleanup, renderHook } from '@testing-library/react';
import { TrackInfo, TrackSource, TrackType } from '@livekit/protocol';
import {
  ConnectionState,
  LocalTrackPublication,
  ParticipantEvent,
  Room,
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
