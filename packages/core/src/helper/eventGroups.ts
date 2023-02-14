import { RoomEvent } from 'livekit-client';

export const RoomEventGroup = {
  /** Subscribe to track updates. */
  identity: [RoomEvent.ParticipantMetadataChanged],
  /** Subscribe to track updates. */
  trackUpdates: [
    RoomEvent.TrackMuted,
    RoomEvent.TrackUnmuted,
    RoomEvent.TrackPublished,
    RoomEvent.TrackUnpublished,
    RoomEvent.TrackSubscribed,
    RoomEvent.TrackUnsubscribed,
  ],
  /** Collection of events around participant connection. */
  participant: [
    RoomEvent.ParticipantConnected,
    RoomEvent.ParticipantDisconnected,
    RoomEvent.ParticipantPermissionsChanged,
  ],
  /** Collection of events around participant metadata updates.  */
  metadata: [RoomEvent.ParticipantMetadataChanged],
  /** Collection of all RoomEvents.  */
  all: [],
} as const;
