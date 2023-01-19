import { lkClassName } from '../styles-interface';

export function setupChatToggle() {
  const className: string = [lkClassName('button'), lkClassName('chat-toggle')].join(' ');
  return { className };
}
