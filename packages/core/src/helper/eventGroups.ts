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

  RoomEvent.TrackMuted,
  RoomEvent.TrackUnmuted,
  RoomEvent.TrackPublished,
  RoomEvent.TrackUnpublished,
  RoomEvent.TrackStreamStateChanged,
  RoomEvent.TrackSubscriptionFailed,
  RoomEvent.TrackSubscriptionPermissionChanged,
  RoomEvent.TrackSubscriptionStatusChanged,
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
