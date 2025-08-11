import { autoUpdate, computePosition, flip, offset, shift } from '@floating-ui/dom';

export function computeMenuPosition(
  button: HTMLElement,
  menu: HTMLElement,
  onUpdate?: (x: number, y: number) => void,
): () => void {
  const cleanup = autoUpdate(button, menu, async () => {
    const { x, y } = await computePosition(button, menu, {
      placement: 'top',
      middleware: [offset(6), flip(), shift({ padding: 5 })],
    });

    onUpdate?.(x, y);
  });
  return cleanup;
}

export function wasClickOutside(insideElement: HTMLElement, event: MouseEvent): boolean {
  const isOutside = !insideElement.contains(event.target as Node);
  return isOutside;
}
