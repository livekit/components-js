import { prefixClass } from '../styles-interface';

export function setupChatToggle() {
  const className: string = [prefixClass('button'), prefixClass('chat-toggle')].join(' ');
  return { className };
}
