import type { TrackReferenceOrPlaceholder } from '@livekit/components-core';
import * as React from 'react';

/**
 * This context provides a `TrackReferenceOrPlaceholder` to all child components.
 * @public
 */
export const TrackRefContext = React.createContext<TrackReferenceOrPlaceholder | undefined>(
  undefined,
);

/**
 * @public
 * @deprecated `TrackContext` has been to `TrackRefContext`, use this as a drop in replacement.
 */
export const TrackContext = TrackRefContext;

/**
 * Ensures that a track reference is provided via context.
 * If not inside a `TrackRefContext`, an error is thrown.
 * @public
 * @deprecated `useTrackContext` has been to `useTrackRefContext`, use this as a drop in replacement.
 */
export function useTrackContext() {
  return useTrackRefContext();
}

/**
 * Ensures that a track reference is provided via context.
 * If not inside a `TrackRefContext`, an error is thrown.
 * @public
 */
export function useTrackRefContext() {
  const trackReference = React.useContext(TrackRefContext);
  if (!trackReference) {
    throw Error('tried to access track context outside of track context provider');
  }
  return trackReference;
}

/**
 * Returns a track reference from the `TrackContext` if it exists, otherwise `undefined`.
 * @public
 * @deprecated `useMaybeTrackContext` has been to `useMaybeTrackRefContext`, use this as a drop in replacement.
 */
export function useMaybeTrackContext() {
  return useMaybeTrackRefContext();
}

/**
 * Returns a track reference from the `TrackRefContext` if it exists, otherwise `undefined`.
 * @public
 */
export function useMaybeTrackRefContext() {
  return React.useContext(TrackRefContext);
}

/**
 * Ensures that a track reference is provided, either via context or explicitly as a parameter.
 * If not inside a `TrackContext` and no track reference is provided, an error is thrown.
 * @public
 * @deprecated `useEnsureTrackReference` has been to `useEnsureTrackRef`, use this as a drop in replacement.
 */
export function useEnsureTrackReference(track?: TrackReferenceOrPlaceholder) {
  return useEnsureTrackRef(track);
}

/**
 * Ensures that a track reference is provided, either via context or explicitly as a parameter.
 * If not inside a `TrackRefContext` and no track reference is provided, an error is thrown.
 * @public
 */
export function useEnsureTrackRef(trackRef?: TrackReferenceOrPlaceholder) {
  const context = useMaybeTrackRefContext();
  const ref = trackRef ?? context;
  if (!ref) {
    throw new Error(
      'No TrackRef, make sure you are inside a TrackRefContext or pass the TrackRef explicitly',
    );
  }
  return ref;
}
