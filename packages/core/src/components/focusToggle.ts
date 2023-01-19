import { prefixClass } from '../styles-interface';

export function setupFocusToggle() {
  const className: string = [prefixClass('button'), prefixClass('focus-toggle-button')].join(' ');
  return { className };
}
