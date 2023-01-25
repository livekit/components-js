import { computePosition, flip, offset, shift } from '@floating-ui/dom';

export async function computeMenuPosition(
  button: HTMLElement,
  menu: HTMLElement,
): Promise<{ x: number; y: number }> {
  const { x, y } = await computePosition(button, menu, {
    placement: 'top',
    middleware: [offset(6), flip(), shift({ padding: 5 })],
  });
  return { x, y };
}

export function wasClickOutside(insideElement: HTMLElement, event: MouseEvent): boolean {
  const isOutside = !insideElement.contains(event.target as Node);
  return isOutside;
}
