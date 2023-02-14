import { RoomEvent } from 'livekit-client';

export type UpdateOnlyOn = (RoomEvent[] | RoomEvent)[];

export function toRoomEvents(updateOnlyOn: UpdateOnlyOn): RoomEvent[] {
  const events: RoomEvent[] = [];
  updateOnlyOn.forEach((value) => {
    if (Array.isArray(value)) {
      events.concat(value);
    } else {
      events.push(value);
    }
  });
  return events;
}

/**
 * RoomEventGroup is a helper object of RoomEvents that are logically grouped together.
 * The intention is to provide a high-level way to get all the RoomEvents needed to subscribe to certain state changes.
 *
 * @example
 * ```tsx
 *   // Get all events needed to listen to tack updates.
 *   const events = RoomEventGroup.trackUpdates
 * ```
 */
export const RoomEventGroup: Record<string, RoomEvent[]> = {
  /**  */
  identity: [RoomEvent.ParticipantMetadataChanged],
  /** Update on participant track updates. */
  trackUpdates: [
    RoomEvent.TrackMuted,
    RoomEvent.TrackUnmuted,
    RoomEvent.TrackPublished,
    RoomEvent.TrackUnpublished,
    RoomEvent.TrackSubscribed,
    RoomEvent.TrackUnsubscribed,
  ],
  /** Update on participants joining and leaving the room. */
  participant: [
    RoomEvent.ParticipantConnected,
    RoomEvent.ParticipantDisconnected,
    RoomEvent.ParticipantPermissionsChanged,
  ],
  /** Collection of events around participant metadata updates.  */
  metadata: [RoomEvent.ParticipantMetadataChanged],
  /** Collection of all RoomEvents.  */
  all: [],
};
