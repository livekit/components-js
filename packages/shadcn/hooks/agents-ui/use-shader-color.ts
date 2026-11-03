import {
  type CSSProperties,
  type RefObject,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

type RGB = [number, number, number];

/**
 * The probe's parent color. A color the browser can't use, such as an undefined `var()`, makes the
 * probe inherit it, which marks the color as unresolved.
 */
const UNRESOLVED_SENTINEL = 'rgb(1, 2, 3)';
const UNRESOLVED_SENTINEL_HEX = '#010203';

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

  // The canvas ignores a color it can't parse and keeps the previous one, so start from a known one
  canvasContext.fillStyle = UNRESOLVED_SENTINEL_HEX;
  canvasContext.fillStyle = color;
  if (canvasContext.fillStyle === UNRESOLVED_SENTINEL_HEX) return null;

  canvasContext.clearRect(0, 0, 1, 1);
  canvasContext.fillRect(0, 0, 1, 1);
  const [r = 0, g = 0, b = 0, a = 0] = canvasContext.getImageData(0, 0, 1, 1).data;
  return a === 0 ? null : [r / 255, g / 255, b / 255];
}

function computedRgb(element: HTMLElement): RGB | null {
  const computed = getComputedStyle(element).color;
  if (!computed || computed === UNRESOLVED_SENTINEL) return null;

  const rgb = computed.match(
    /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:[\s,/]+([\d.]+%?))?/,
  );
  if (rgb) {
    // A fully transparent color has nothing to draw with
    if (rgb[4] !== undefined && parseFloat(rgb[4]) === 0) return null;
    return [Number(rgb[1]) / 255, Number(rgb[2]) / 255, Number(rgb[3]) / 255];
  }
  return paintedRgb(computed);
}

// Attributes that themes usually switch on <html> or <body>
const THEME_ATTRIBUTES = ['class', 'data-theme', 'data-mode', 'data-color-scheme', 'data-lk-theme'];

/**
 * Calls `onChange` when the page theme may have changed: a theme attribute or `<html>`'s inline
 * style (where some apps set variables) changes, or the system color scheme does.
 */
export function subscribeToThemeChanges(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: [...THEME_ATTRIBUTES, 'style'],
  });
  if (document.body) {
    // Not <body>'s style, which scroll locking and dialogs change often
    observer.observe(document.body, { attributes: true, attributeFilter: THEME_ATTRIBUTES });
  }

  const colorScheme = window.matchMedia?.('(prefers-color-scheme: dark)');
  colorScheme?.addEventListener('change', onChange);

  return () => {
    observer.disconnect();
    colorScheme?.removeEventListener('change', onChange);
  };
}

/**
 * Resolves a CSS color to the 0–1 RGB triple a shader uniform needs, falling back to `fallback`
 * when it can't be resolved.
 *
 * Hex colors convert directly. Anything else, such as `var(--primary)` or `oklch()`, is read from a
 * hidden probe rendered inside the component, so theme variables resolve where the component sits.
 * It's read again when the page theme changes, so a theme variable follows light and dark mode.
 *
 * Render the probe when `probe` is set:
 *
 * ```tsx
 * {probe && (
 *   <span hidden style={probe.parentStyle}>
 *     <span ref={probe.ref} style={probe.style} />
 *   </span>
 * )}
 * ```
 */
export function useShaderColor(
  color: string,
  fallback: string,
): {
  rgb: RGB;
  probe: {
    ref: RefObject<HTMLSpanElement | null>;
    style: CSSProperties;
    parentStyle: CSSProperties;
  } | null;
} {
  const hex = useMemo(() => hexToRgb(color), [color]);
  const fallbackRgb = useMemo<RGB>(() => hexToRgb(fallback) ?? [0, 0, 0], [fallback]);
  const [resolved, setResolved] = useState<RGB | null>(null);
  const probeRef = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    if (hexToRgb(color)) return;

    const resolve = () => {
      const next = probeRef.current ? computedRgb(probeRef.current) : null;
      setResolved((prev) =>
        prev && next && prev.every((channel, idx) => channel === next[idx]) ? prev : next,
      );
    };

    resolve();
    return subscribeToThemeChanges(resolve);
  }, [color]);

  const probe = hex
    ? null
    : { ref: probeRef, style: { color }, parentStyle: { color: UNRESOLVED_SENTINEL } };

  return { rgb: hex ?? resolved ?? fallbackRgb, probe };
}
