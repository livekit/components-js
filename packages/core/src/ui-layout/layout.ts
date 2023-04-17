import type { TrackReference } from '../track-reference';

export type LayoutContextState = {
  pin: PinState;
  chat: ChatState;
};

export const LAYOUT_DEFAULT_STATE: LayoutContextState = {
  pin: [],
  chat: 'closed',
};

// ## PinState Type
export type PinState = TrackReference[];
// ## ChatState Types
export type ChatState = 'open' | 'closed';
