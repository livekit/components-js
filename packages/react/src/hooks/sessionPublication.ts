import {
  type Room,
  ConnectionState,
  Track,
  type LocalTrack,
  type LocalTrackPublication,
  type TrackPublishOptions,
} from 'livekit-client';
import type { SessionConnectOptions } from './useSession';

// Optional capability bridge: components continues to support SDK releases without reservations.
// Keep these structural types internal until the SDK API is released as stable.
interface Reservation {
  attachTrack(track: LocalTrack): Promise<LocalTrackPublication>;
  cancel(): Promise<void>;
}
interface PublicationIntent {
  source: Track.Source.Microphone | Track.Source.Camera;
  format?: { channelCount: 1 | 2 } | { width: number; height: number; frameRate?: number };
  publishOptions?: TrackPublishOptions;
}
// Versioned, non-public SDK integration. No preparation members appear on Room's API.
const sessionPublicationKey = Symbol.for('livekit.internal.sessionPublication.v1');
interface SessionPublicationBridge {
  prepare(intent: PublicationIntent): Reservation;
  connect(
    url: string,
    token: string,
    options: Parameters<Room['connect']>[2],
    reservations: Reservation[],
  ): Promise<void>;
}
type PreparingRoom = Room & { [sessionPublicationKey]?: SessionPublicationBridge };

/** Connects immediately while capture and prepared publication proceed independently. */
export async function connectSessionWithTracks(
  room: Room,
  connect: (connectRoom: Room['connect']) => Promise<void>,
  tracks: NonNullable<SessionConnectOptions['tracks']>,
  signal: AbortSignal,
): Promise<void> {
  const bridge = (room as PreparingRoom)[sessionPublicationKey];
  const reservations: Reservation[] = [];
  const captures = new Set<LocalTrack>();
  let cancelled = signal.aborted;
  const abortError = () =>
    signal.reason ?? new DOMException('Session startup aborted', 'AbortError');
  let rejectAbort!: (reason: unknown) => void;
  const aborted = new Promise<never>((_, reject) => {
    rejectAbort = reject;
  });
  const onAbort = () => {
    cancelled = true;
    rejectAbort(abortError());
    for (const reservation of reservations) void reservation.cancel().catch(() => {});
    for (const track of captures) track.stop();
  };
  signal.addEventListener('abort', onAbort, { once: true });

  try {
    if (cancelled) throw abortError();
    const prepare = (intent: PublicationIntent) => {
      const reservation =
        room.state === ConnectionState.Disconnected ? bridge?.prepare(intent) : undefined;
      if (reservation) reservations.push(reservation);
      return reservation;
    };
    const microphone = tracks.microphone?.enabled
      ? prepare({
          source: Track.Source.Microphone,
          publishOptions: tracks.microphone.publishOptions,
        })
      : undefined;
    // Resolution is a declared envelope; never query a device to discover it before JOIN.
    const resolution = room.options.videoCaptureDefaults?.resolution;
    const camera =
      tracks.camera?.enabled && resolution
        ? prepare({
            source: Track.Source.Camera,
            format: resolution,
            publishOptions: tracks.camera.publishOptions,
          })
        : undefined;

    const capture = async (
      source: Track.Source.Microphone | Track.Source.Camera,
      reservation: Reservation,
    ) => {
      const localTracks = await room.localParticipant.createTracks({
        audio: source === Track.Source.Microphone,
        video: source === Track.Source.Camera,
      });
      for (const track of localTracks) captures.add(track);
      if (cancelled || signal.aborted) {
        localTracks.forEach((track) => track.stop());
        throw abortError();
      }
      const track = localTracks[0];
      if (!track) throw new Error(`No ${source} track was captured`);
      await reservation.attachTrack(track);
    };

    // Invoke connection first. Neither credential acquisition nor JOIN waits for getUserMedia.
    const connecting = connect((url, token, options) =>
      bridge
        ? bridge.connect(url, token, options, reservations)
        : room.connect(url, token, options),
    );
    await Promise.race([
      Promise.all([
        connecting,
        tracks.microphone?.enabled
          ? microphone
            ? capture(Track.Source.Microphone, microphone)
            : room.localParticipant.setMicrophoneEnabled(
                true,
                undefined,
                tracks.microphone.publishOptions ?? {},
              )
          : undefined,
        tracks.camera?.enabled
          ? camera
            ? capture(Track.Source.Camera, camera)
            : room.localParticipant.setCameraEnabled(
                true,
                undefined,
                tracks.camera.publishOptions ?? {},
              )
          : undefined,
        tracks.screenShare?.enabled
          ? room.localParticipant.setScreenShareEnabled(
              true,
              undefined,
              tracks.screenShare.publishOptions ?? {},
            )
          : undefined,
      ]),
      aborted,
    ]);
  } catch (error) {
    cancelled = true;
    for (const track of captures) track.stop();
    // Disconnect settles pending JOIN before cancelling senders from its deferred local offer.
    await room.disconnect();
    throw error;
  } finally {
    signal.removeEventListener('abort', onAbort);
    await Promise.all(reservations.map((reservation) => reservation.cancel()));
  }
}
