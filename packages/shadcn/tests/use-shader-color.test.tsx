import { describe, it, expect, afterEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useShaderColor } from '@/hooks/agents-ui/use-shader-color';

const FALLBACK = '#1FD5F9';
const FALLBACK_RGB = [0x1f / 255, 0xd5 / 255, 0xf9 / 255];

function probe(color: string) {
  const element = document.createElement('span');
  element.style.color = color;
  document.body.appendChild(element);
  return { current: element };
}

afterEach(() => {
  document.body.innerHTML = '';
  document.documentElement.className = '';
});

describe('useShaderColor', () => {
  it('converts a hex color', () => {
    const { result } = renderHook(() => useShaderColor('#ff8000', { current: null }, FALLBACK));
    expect(result.current).toEqual([1, 0x80 / 255, 0]);
  });

  it('converts a three-digit hex color', () => {
    const { result } = renderHook(() => useShaderColor('#f80', { current: null }, FALLBACK));
    expect(result.current).toEqual([1, 0x88 / 255, 0]);
  });

  it("reads other colors from the element's computed color", () => {
    const element = probe('rgb(255, 0, 0)');
    const { result } = renderHook(() => useShaderColor('rgb(255, 0, 0)', element, FALLBACK));
    expect(result.current).toEqual([1, 0, 0]);
  });

  it('reads the color again when the page theme changes', async () => {
    const element = probe('rgb(255, 0, 0)');
    const { result } = renderHook(() => useShaderColor('var(--primary)', element, FALLBACK));
    expect(result.current).toEqual([1, 0, 0]);

    // Stands in for a theme variable resolving to a new value under `.dark`
    element.current.style.color = 'rgb(0, 0, 255)';
    await act(async () => {
      document.documentElement.classList.add('dark');
      await Promise.resolve();
    });
    expect(result.current).toEqual([0, 0, 1]);
  });

  it("uses the fallback when the color can't be resolved", () => {
    const { result } = renderHook(() =>
      useShaderColor('var(--missing)', { current: null }, FALLBACK),
    );
    expect(result.current).toEqual(FALLBACK_RGB);
  });
});
