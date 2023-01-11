import { lkClassName } from '../utils';

export function setupChatToggle() {
  const className: string = [lkClassName('button'), lkClassName('chat-toggle-button')].join(' ');
  return { className };
}
