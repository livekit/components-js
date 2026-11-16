import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, waitFor, screen, fireEvent } from '@testing-library/react';
import { ReactShaderToy } from '@/components/agents-ui/react-shader-toy';

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
    vi.unstubAllGlobals();
  });

  it('renders a canvas element', () => {
    const { container } = render(
      <ReactShaderToy fs="void mainImage(out vec4 fragColor, in vec2 fragCoord){ fragColor = vec4(1.0); }" />,
    );
    expect(container.querySelector('canvas')).toBeInTheDocument();
  });

  it('applies html attributes (id, class, style, aria)', () => {
    render(
      <ReactShaderToy
        fs="void mainImage(out vec4 fragColor, in vec2 fragCoord){ fragColor = vec4(1.0); }"
        id="shader-canvas"
        className="custom-class"
        style={{ opacity: 0.7 }}
        aria-label="Shader canvas"
      />,
    );
    const canvas = screen.getByLabelText('Shader canvas');
    expect(canvas).toHaveAttribute('id', 'shader-canvas');
    expect(canvas).toHaveClass('custom-class');
    expect(canvas).toHaveStyle({ opacity: '0.7' });
  });

  it('applies click handler', () => {
    const onClick = vi.fn();
    render(
      <ReactShaderToy
        fs="void mainImage(out vec4 fragColor, in vec2 fragCoord){ fragColor = vec4(1.0); }"
        data-testid="shader-canvas"
        onClick={onClick}
      />,
    );
    const canvas = screen.getByTestId('shader-canvas');
    fireEvent.click(canvas);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('requests a WebGL context on mount', async () => {
    render(
      <ReactShaderToy fs="void mainImage(out vec4 fragColor, in vec2 fragCoord){ fragColor = vec4(1.0); }" />,
    );

    await waitFor(() => {
      expect(getContextMock).toHaveBeenCalledWith('webgl', expect.any(Object));
    });
  });

  it('draws once per frame when the IntersectionObserver reports the canvas as visible', () => {
    // Queue animation frames so each test frame runs every pending callback exactly once.
    let frameQueue: FrameRequestCallback[] = [];
    (globalThis as any).requestAnimationFrame = (cb: FrameRequestCallback) => {
      frameQueue.push(cb);
      return frameQueue.length;
    };
    const runFrame = () => {
      const callbacks = frameQueue;
      frameQueue = [];
      for (const cb of callbacks) cb(performance.now());
    };

    // Capture the observer callback so the test decides when the canvas becomes visible.
    let intersectionCallback: IntersectionObserverCallback | undefined;
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(callback: IntersectionObserverCallback) {
          intersectionCallback = callback;
        }
        observe() {}
        unobserve() {}
        disconnect() {}
        takeRecords() {
          return [];
        }
      },
    );

    // Fake WebGL context: every method is a no-op that returns an object, except the overrides.
    const drawArrays = vi.fn();
    const overrides: Record<string, unknown> = { drawArrays, getExtension: () => null };
    const noops = new Map<PropertyKey, () => object>();
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(function (
      this: HTMLCanvasElement,
    ) {
      return new Proxy(
        {},
        {
          // An arrow function keeps `this` bound to the canvas that requested the context.
          get: (_, prop) => {
            if (prop === 'canvas') return this;
            if (prop in overrides) return overrides[prop as string];
            if (!noops.has(prop)) noops.set(prop, () => ({}));
            return noops.get(prop);
          },
        },
      );
    } as any);

    render(
      <ReactShaderToy fs="void mainImage(out vec4 fragColor, in vec2 fragCoord){ fragColor = vec4(1.0); }" />,
    );

    // The first frame runs init(), which starts the draw loop.
    runFrame();
    // The observer's first callback reports the canvas as visible while the loop is running.
    intersectionCallback?.(
      [{ isIntersecting: true } as IntersectionObserverEntry],
      {} as IntersectionObserver,
    );

    drawArrays.mockClear();
    const frameCount = 10;
    for (let i = 0; i < frameCount; i++) runFrame();

    expect(drawArrays).toHaveBeenCalledTimes(frameCount);
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
