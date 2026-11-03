import { type RefObject, useLayoutEffect, useMemo, useState } from 'react';

type RGB = [number, number, number];

function hexToRgb(color: string): RGB | null {
  const match = color.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (!match?.[1]) return null;

  const hex = match[1].length === 3 ? match[1].replace(/./g, '$&$&') : match[1];
  const channel = (offset: number) => parseInt(hex.slice(offset, offset + 2), 16) / 255;
  return [channel(0), channel(2), channel(4)];
}

let canvasContext: CanvasRenderingContext2D | null | undefined;

/**
 * Converts any color the browser can paint (`oklch()`, `color()`, named colors, and so on) to sRGB
 * by drawing one pixel with it.
 */
function paintedRgb(color: string): RGB | null {
  if (canvasContext === undefined) {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 1;
    canvasContext = canvas.getContext('2d', { willReadFrequently: true });
  }
  if (!canvasContext) return null;

  canvasContext.clearRect(0, 0, 1, 1);
  canvasContext.fillStyle = color;
  canvasContext.fillRect(0, 0, 1, 1);
  const [r = 0, g = 0, b = 0, a = 0] = canvasContext.getImageData(0, 0, 1, 1).data;
  return a === 0 ? null : [r / 255, g / 255, b / 255];
}

function computedRgb(element: HTMLElement): RGB | null {
  const computed = getComputedStyle(element).color;
  if (!computed) return null;

  const rgb = computed.match(/^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/);
  if (rgb) return [Number(rgb[1]) / 255, Number(rgb[2]) / 255, Number(rgb[3]) / 255];
  return paintedRgb(computed);
}

function subscribeToThemeChanges(onChange: () => void) {
  // Themes usually switch with a class or data attribute on <html> or <body>, or follow the system
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true });
  if (document.body) observer.observe(document.body, { attributes: true });

  const colorScheme = window.matchMedia?.('(prefers-color-scheme: dark)');
  colorScheme?.addEventListener('change', onChange);

  return () => {
    observer.disconnect();
    colorScheme?.removeEventListener('change', onChange);
  };
}

/**
 * Resolves a CSS color to the 0–1 RGB triple a shader uniform needs.
 *
 * Hex colors convert directly. Anything else, such as `var(--primary)` or `oklch()`, is read from
 * `element`'s computed `color`, so set `color` on that element to the same value. It's read again
 * when the page theme changes, so a theme variable follows light and dark mode.
 */
export function useShaderColor(
  color: string,
  element: RefObject<HTMLElement | null>,
  fallback: string,
): RGB {
  const hex = useMemo(() => hexToRgb(color), [color]);
  const fallbackRgb = useMemo<RGB>(() => hexToRgb(fallback) ?? [0, 0, 0], [fallback]);
  const [resolved, setResolved] = useState<RGB | null>(null);

  useLayoutEffect(() => {
    if (hexToRgb(color)) return;

    const resolve = () => {
      const next = element.current ? computedRgb(element.current) : null;
      setResolved((prev) =>
        prev && next && prev.every((channel, idx) => channel === next[idx]) ? prev : next,
      );
    };

    resolve();
    return subscribeToThemeChanges(resolve);
  }, [color, element]);

  return hex ?? resolved ?? fallbackRgb;
}
