// import type { Room } from 'livekit-client';
import { prefixClass } from '../styles-interface';

export function setupMemberListButton() {
  const className: string = prefixClass('member-list-button');
  return { className };
}
