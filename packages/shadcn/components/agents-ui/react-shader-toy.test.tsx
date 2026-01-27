import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { ReactShaderToy } from './react-shader-toy';

describe('ReactShaderToy', () => {
  const getContextMock = vi.fn(() => null);
  const originalRequestAnimationFrame = globalThis.requestAnimationFrame;
  const originalCancelAnimationFrame = globalThis.cancelAnimationFrame;

  beforeEach(() => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(getContextMock as any);
    (globalThis as any).requestAnimationFrame = (cb: FrameRequestCallback) => {
      cb(0);
      return 1;
    };
    (globalThis as any).cancelAnimationFrame = vi.fn();
  });

  afterEach(() => {
    getContextMock.mockClear();
    globalThis.requestAnimationFrame = originalRequestAnimationFrame;
    globalThis.cancelAnimationFrame = originalCancelAnimationFrame;
    vi.restoreAllMocks();
  });

  it('renders a canvas element', () => {
    const { container } = render(
      <ReactShaderToy
        fs="void mainImage(out vec4 fragColor, in vec2 fragCoord){ fragColor = vec4(1.0); }"
      />,
    );
    expect(container.querySelector('canvas')).toBeInTheDocument();
  });

  it('requests a WebGL context on mount', async () => {
    render(
      <ReactShaderToy
        fs="void mainImage(out vec4 fragColor, in vec2 fragCoord){ fragColor = vec4(1.0); }"
      />,
    );

    await waitFor(() => {
      expect(getContextMock).toHaveBeenCalledWith('webgl', expect.any(Object));
    });
  });

  it('applies custom inline styles', () => {
    const { container } = render(
      <ReactShaderToy
        fs="void mainImage(out vec4 fragColor, in vec2 fragCoord){ fragColor = vec4(1.0); }"
        style={{ backgroundColor: 'red' }}
      />,
    );
    const canvas = container.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
    expect(canvas?.getAttribute('style')).toContain('background-color');
  });
});
