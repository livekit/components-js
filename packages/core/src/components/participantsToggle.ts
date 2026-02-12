import { prefixClass } from '../styles-interface';

export function setupParticipantsToggle() {
  const className: string = [prefixClass('button'), prefixClass('participants-toggle')].join(' ');
  return { className };
}
