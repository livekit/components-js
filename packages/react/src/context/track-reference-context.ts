import type { TrackReferenceOrPlaceholder } from '@livekit/components-core';
import * as React from 'react';

/**
 * @public
 * @deprecated `TrackContext` has been to `TrackRefContext`, use this as a drop in replacement.
 */
export const TrackContext = React.createContext<TrackReferenceOrPlaceholder | undefined>(undefined);

/**
 * This context provides a `TrackReferenceOrPlaceholder` to all child components.
 * @public
 */
export const TrackRefContext = TrackContext;

/**
 * Ensures that a track reference is provided via context.
 * If not inside a `TrackRefContext`, an error is thrown.
 * @public
 * @deprecated `useTrackContext` has been to `useTrackRefContext`, use this as a drop in replacement.
 */
export function useTrackContext() {
  const trackReference = React.useContext(TrackContext);
  if (!trackReference) {
    throw Error('tried to access track context outside of track context provider');
  }
  return trackReference;
}

/**
 * Ensures that a track reference is provided via context.
 * If not inside a `TrackRefContext`, an error is thrown.
 * @public
 */
export function useTrackRefContext() {
  return useTrackContext();
}

/**
 * Returns a track reference from the `TrackContext` if it exists, otherwise `undefined`.
 * @public
 * @deprecated `useMaybeTrackContext` has been to `useMaybeTrackRefContext`, use this as a drop in replacement.
 */
export function useMaybeTrackContext() {
  return React.useContext(TrackContext);
}

/**
 * Returns a track reference from the `TrackRefContext` if it exists, otherwise `undefined`.
 * @public
 */
export function useMaybeTrackRefContext() {
  return useMaybeTrackContext();
}

/**
 * Ensures that a track reference is provided, either via context or explicitly as a parameter.
 * If not inside a `TrackContext` and no track reference is provided, an error is thrown.
 * @public
 * @deprecated `useEnsureTrackReference` has been to `useEnsureTrackRef`, use this as a drop in replacement.
 */
export function useEnsureTrackReference(track?: TrackReferenceOrPlaceholder) {
  const context = useMaybeTrackContext();
  const trackRef = track ?? context;
  if (!trackRef) {
    throw new Error(
      'No TrackRef, make sure you are inside a TrackRefContext or pass the TrackRef explicitly',
    );
  }
  return trackRef;
}

/**
 * Ensures that a track reference is provided, either via context or explicitly as a parameter.
 * If not inside a `TrackRefContext` and no track reference is provided, an error is thrown.
 * @public
 */
export function useEnsureTrackRef(trackRef?: TrackReferenceOrPlaceholder) {
  useEnsureTrackReference(trackRef);
}
