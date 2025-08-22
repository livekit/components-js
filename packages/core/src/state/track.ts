import {
  LocalTrackPublication,
  type RemoteTrackPublication,
  TrackEvent,
  type TrackPublication,
} from 'livekit-client';
import { Signal } from 'signal-polyfill';

export type RemoteTrackSignalState = ReturnType<typeof createRemoteTrackSignalState>;
export type LocalTrackSignalState = ReturnType<typeof createLocalTrackSignalState>;

function createBaseTrackSignalState(publication: TrackPublication, abortSignal: AbortSignal) {
  const muted = new Signal.State<boolean>(publication.isMuted);
  const updateMuted = () => {
    muted.set(publication.isMuted);
  };

  publication.on(TrackEvent.Muted, updateMuted);
  publication.on(TrackEvent.Unmuted, updateMuted);

  abortSignal.addEventListener('abort', () => {
    publication.off(TrackEvent.Muted, updateMuted);
    publication.off(TrackEvent.Unmuted, updateMuted);
  });

  return {
    clientId: crypto.randomUUID(),
    kind: publication.kind,
    source: publication.source,
    muted: new Signal.Computed(() => muted.get()),
    encrypted: new Signal.Computed(() => publication.isEncrypted),
  };
}

export function createRemoteTrackSignalState(
  publication: RemoteTrackPublication,
  abortSignal: AbortSignal,
) {
  const subscriptionStatus = new Signal.State<TrackPublication.SubscriptionStatus>(
    publication.subscriptionStatus,
  );
  const updateSubscriptionStatus = (status: TrackPublication.SubscriptionStatus) => {
    subscriptionStatus.set(status);
  };
  const permissionStatus = new Signal.State<TrackPublication.PermissionStatus>(
    publication.permissionStatus,
  );
  const updatePermissionStatus = (status: TrackPublication.PermissionStatus) => {
    permissionStatus.set(status);
  };
  const muted = new Signal.State<boolean>(publication.isMuted);
  const updateMuted = () => {
    muted.set(publication.isMuted);
  };

  publication.on(TrackEvent.SubscriptionStatusChanged, updateSubscriptionStatus);
  publication.on(TrackEvent.SubscriptionPermissionChanged, updatePermissionStatus);
  publication.on(TrackEvent.Muted, updateMuted);
  publication.on(TrackEvent.Unmuted, updateMuted);

  abortSignal.addEventListener('abort', () => {
    publication.off(TrackEvent.SubscriptionStatusChanged, updateSubscriptionStatus);
    publication.off(TrackEvent.SubscriptionPermissionChanged, updatePermissionStatus);
    publication.off(TrackEvent.Muted, updateMuted);
    publication.off(TrackEvent.Unmuted, updateMuted);
  });

  const baseTrackState = createBaseTrackSignalState(publication, abortSignal);

  return {
    ...baseTrackState,
    id: publication.trackSid,
    subscriptionStatus: new Signal.Computed(() => subscriptionStatus.get()),
    permissionStatus: new Signal.Computed(() => permissionStatus.get()),
  };
}

export function createLocalTrackSignalState(
  publication: LocalTrackPublication,
  abortSignal: AbortSignal,
) {
  const baseTrackState = createBaseTrackSignalState(publication, abortSignal);

  return {
    ...baseTrackState,
    id: publication.trackSid,
  };
}
