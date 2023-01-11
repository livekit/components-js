import { lkClassName } from '../utils';

export function setupFocusToggle() {
  const className: string = [lkClassName('button'), lkClassName('focus-toggle-button')].join(' ');
  return { className };
}
