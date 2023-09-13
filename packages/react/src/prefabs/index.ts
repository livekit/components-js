export { Chat, type ChatProps } from './Chat';
export {
  PreJoin,
  PreJoinProps,
  usePreviewDevice,
  usePreviewTracks,
  type LocalUserChoices,
} from './PreJoin';
export { VideoConference, type VideoConferenceProps } from './VideoConference';
export { ControlBar, type ControlBarProps, type ControlBarControls } from './ControlBar';
export { MediaDeviceMenu, type MediaDeviceMenuProps } from './MediaDeviceMenu';
export { AudioConference, type AudioConferenceProps } from './AudioConference';

// Re-export types from core
export {
  type ChatMessage,
  type ReceivedChatMessage,
  type MessageDecoder,
  type MessageEncoder,
} from '@livekit/components-core';
