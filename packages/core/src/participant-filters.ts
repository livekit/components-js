import { Room, Track, RoomEvent, Participant } from 'livekit-client';
import { getSourceEnabled } from './helper/sources';

/**
 * Filter participants by:
 * - speaking (is currently speaking)
 * - viewer (no permissions to publish)
 * - publisher (is actively publishing)
 * - published source
 * - identity
 * - metadata
 * - muted state
 */

export interface IParticipantFilter {
  subscribe?: (room: Room, onNeedsUpdate: () => void) => () => void;
  filter: <T extends Participant>(participants: T[]) => T[];
}

const filterByEnabledSource = (source: Track.Source): IParticipantFilter => {
  const filter = <T extends Participant>(participants: T[]) => {
    // console.log('filter by enabled source', source);
    return participants.filter((p) => getSourceEnabled(source, p));
  };

  const subscribe = (room: Room, onNeedsUpdate: () => void) => {
    room.on(RoomEvent.TrackMuted, onNeedsUpdate);
    room.on(RoomEvent.TrackUnmuted, onNeedsUpdate);
    room.on(RoomEvent.TrackPublished, onNeedsUpdate);
    room.on(RoomEvent.TrackUnpublished, onNeedsUpdate);

    return () => {
      room.off(RoomEvent.TrackMuted, onNeedsUpdate);
      room.off(RoomEvent.TrackUnmuted, onNeedsUpdate);
      room.off(RoomEvent.TrackPublished, onNeedsUpdate);
      room.off(RoomEvent.TrackUnpublished, onNeedsUpdate);
    };
  };

  return { subscribe, filter };
};

const filterByMetadata = (predicate: (metadata?: string) => boolean): IParticipantFilter => {
  const filter = <T extends Participant>(participants: T[]) => {
    return participants.filter((p) => predicate(p.metadata));
  };

  const subscribe = (room: Room, onNeedsUpdate: () => void) => {
    room.on(RoomEvent.ParticipantMetadataChanged, onNeedsUpdate);
    return () => {
      room.off(RoomEvent.ParticipantMetadataChanged, onNeedsUpdate);
    };
  };

  return { subscribe, filter };
};

const filterByIdentity = (predicate: (identity: string) => boolean): IParticipantFilter => {
  const filter = <T extends Participant>(participants: T[]) => {
    return participants.filter((p) => predicate(p.identity));
  };

  return { filter };
};

const filterBySubscriptions = (): IParticipantFilter => {
  const filter = <T extends Participant>(participants: T[]) => {
    return participants.filter((p) => p.getTracks().some((track) => track.isSubscribed));
  };

  const subscribe = (room: Room, onNeedsUpdate: () => void) => {
    room.on(RoomEvent.TrackSubscribed, onNeedsUpdate);
    room.on(RoomEvent.TrackUnsubscribed, onNeedsUpdate);
    return () => {
      room.off(RoomEvent.TrackSubscribed, onNeedsUpdate);
      room.off(RoomEvent.TrackUnsubscribed, onNeedsUpdate);
    };
  };

  return { subscribe, filter };
};

// const filterByPublishedSource = (sources: Track.Source[]): IParticipantFilter => {
//   const filter = <T extends Participant>(participants: T[]) => {
//     participants.filter((p) => p.getTracks().some((track) => sources.includes(track.source)));
//     return participants;
//   };

//   const subscribe = (room: Room, onNeedsUpdate: () => void) => {
//     room.on(RoomEvent.TrackPublished, onNeedsUpdate);
//     room.on(RoomEvent.TrackUnpublished, onNeedsUpdate);
//     return () => {
//       room.off(RoomEvent.TrackPublished, onNeedsUpdate);
//       room.off(RoomEvent.TrackUnpublished, onNeedsUpdate);
//     };
//   };

//   return { subscribe, filter };
// };

export const ParticipantFilter = {
  metaData: filterByMetadata,
  identity: filterByIdentity,
  subscribed: filterBySubscriptions,
  sourceEnabled: filterByEnabledSource,
};
