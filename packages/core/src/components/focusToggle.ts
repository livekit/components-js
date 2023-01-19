import { lkClassName } from '../styles-interface';

export function setupFocusToggle() {
  const className: string = [lkClassName('button'), lkClassName('focus-toggle-button')].join(' ');
  return { className };
}
