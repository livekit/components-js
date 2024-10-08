import { ParticipantEvent, RoomEvent } from 'livekit-client';

export const allRemoteParticipantRoomEvents = [
  RoomEvent.ConnectionStateChanged,
  RoomEvent.RoomMetadataChanged,

  RoomEvent.ActiveSpeakersChanged,
  RoomEvent.ConnectionQualityChanged,

  RoomEvent.ParticipantConnected,
  RoomEvent.ParticipantDisconnected,
  RoomEvent.ParticipantPermissionsChanged,
  RoomEvent.ParticipantMetadataChanged,
  RoomEvent.ParticipantNameChanged,
  RoomEvent.ParticipantAttributesChanged,

  RoomEvent.TrackMuted,
  RoomEvent.TrackUnmuted,
  RoomEvent.TrackPublished,
  RoomEvent.TrackUnpublished,
  RoomEvent.TrackStreamStateChanged,
  RoomEvent.TrackSubscriptionFailed,
  RoomEvent.TrackSubscriptionPermissionChanged,
  RoomEvent.TrackSubscriptionStatusChanged,
];

export const allParticipantRoomEvents = [
  ...allRemoteParticipantRoomEvents,
  RoomEvent.LocalTrackPublished,
  RoomEvent.LocalTrackUnpublished,
];

export const participantTrackEvents = [
  ParticipantEvent.TrackPublished,
  ParticipantEvent.TrackUnpublished,
  ParticipantEvent.TrackMuted,
  ParticipantEvent.TrackUnmuted,
  ParticipantEvent.TrackStreamStateChanged,
  ParticipantEvent.TrackSubscribed,
  ParticipantEvent.TrackUnsubscribed,
  ParticipantEvent.TrackSubscriptionPermissionChanged,
  ParticipantEvent.TrackSubscriptionFailed,
  ParticipantEvent.LocalTrackPublished,
  ParticipantEvent.LocalTrackUnpublished,
];

export const allRemoteParticipantEvents = [
  ParticipantEvent.ConnectionQualityChanged,
  ParticipantEvent.IsSpeakingChanged,
  ParticipantEvent.ParticipantMetadataChanged,
  ParticipantEvent.ParticipantPermissionsChanged,

  ParticipantEvent.TrackMuted,
  ParticipantEvent.TrackUnmuted,
  ParticipantEvent.TrackPublished,
  ParticipantEvent.TrackUnpublished,
  ParticipantEvent.TrackStreamStateChanged,
  ParticipantEvent.TrackSubscriptionFailed,
  ParticipantEvent.TrackSubscriptionPermissionChanged,
  ParticipantEvent.TrackSubscriptionStatusChanged,
];

export const allParticipantEvents = [
  ...allRemoteParticipantEvents,
  ParticipantEvent.LocalTrackPublished,
  ParticipantEvent.LocalTrackUnpublished,
];
