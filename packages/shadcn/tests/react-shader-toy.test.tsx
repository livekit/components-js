import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, waitFor, screen, fireEvent, act, cleanup } from '@testing-library/react';
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

const fs = `void mainImage(out vec4 color, in vec2 coord) {
  color = vec4(iTime + iResolution.x);
}`;
const fsWithValue = fs.replace('iTime +', 'uValue + iTime +');

describe('ReactShaderToy loop lifecycle', () => {
  let frames: Map<number, FrameRequestCallback>;
  let nextId: number;
  let timestamp: number;
  let intersections: IntersectionObserverCallback[];
  let gl: Record<string, unknown> & {
    drawArrays: ReturnType<typeof vi.fn>;
    uniform1f: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    frames = new Map();
    nextId = 0;
    timestamp = 1000;
    intersections = [];
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      const id = ++nextId;
      frames.set(id, callback);
      return id;
    });
    vi.stubGlobal('cancelAnimationFrame', (id: number) => frames.delete(id));
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(callback: IntersectionObserverCallback) {
          intersections.push(callback);
        }
        observe() {}
        disconnect() {}
      },
    );
    gl = { drawArrays: vi.fn(), uniform1f: vi.fn() };
    Object.assign(
      gl,
      Object.fromEntries(
        [
          'clearColor',
          'clearDepth',
          'enable',
          'depthFunc',
          'viewport',
          'uniform2fv',
          'shaderSource',
          'compileShader',
          'attachShader',
          'linkProgram',
          'useProgram',
          'enableVertexAttribArray',
          'bindBuffer',
          'bufferData',
          'clear',
          'vertexAttribPointer',
          'drawArrays',
          'deleteProgram',
          'uniform1f',
        ].map((name) => [name, vi.fn()]),
      ),
    );
    Object.assign(gl, {
      createShader: () => ({}),
      createProgram: () => ({}),
      createBuffer: () => ({}),
      getShaderParameter: () => true,
      getProgramParameter: () => true,
      getShaderInfoLog: () => '',
      getAttribLocation: () => 0,
      getUniformLocation: (_: unknown, name: string) => ({ name }),
      getExtension: () => null,
    });
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(function (
      this: HTMLCanvasElement,
    ) {
      gl.canvas = this;
      return gl as unknown as WebGLRenderingContext;
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  function frame() {
    act(() => {
      timestamp += 16;
      const pending = [...frames];
      for (const [id, callback] of pending) {
        frames.delete(id);
        callback(timestamp);
      }
    });
  }

  function visibility(visible: boolean) {
    act(() =>
      intersections.at(-1)!(
        [{ isIntersecting: visible } as IntersectionObserverEntry],
        {} as IntersectionObserver,
      ),
    );
  }

  it('keeps one frame scheduled across visibility and uniform updates', () => {
    const { rerender, unmount } = render(
      <ReactShaderToy fs={fsWithValue} uniforms={{ uValue: { type: '1f', value: 1 } }} />,
    );
    frame();
    visibility(true);
    visibility(true);
    expect(frames.size).toBe(1);
    frame();
    rerender(<ReactShaderToy fs={fsWithValue} uniforms={{ uValue: { type: '1f', value: 2 } }} />);
    expect(frames.size).toBe(1);
    frame();
    expect(gl.drawArrays).toHaveBeenCalledTimes(2);
    expect(gl.uniform1f).toHaveBeenLastCalledWith({ name: 'iTime' }, 0.016);
    unmount();
    expect(frames.size).toBe(0);
  });

  it('stops drawing off-screen and resumes one loop on re-entry', () => {
    render(<ReactShaderToy fs={fs} />);
    frame();
    frame();
    visibility(false);
    expect(frames.size).toBe(0);
    frame();
    expect(gl.drawArrays).toHaveBeenCalledTimes(1);
    visibility(true);
    visibility(true);
    expect(frames.size).toBe(1);
    frame();
    expect(gl.drawArrays).toHaveBeenCalledTimes(2);
    expect(frames.size).toBe(1);
  });

  it('cleans up pending initialization and drawing under StrictMode', () => {
    const { unmount } = render(<ReactShaderToy fs={fs} />, { reactStrictMode: true });
    frame();
    visibility(true);
    visibility(true);
    expect(frames.size).toBe(1);
    unmount();
    expect(frames.size).toBe(0);
    frame();
    expect(gl.drawArrays).not.toHaveBeenCalled();
  });
});
