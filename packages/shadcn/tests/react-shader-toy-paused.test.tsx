import { act, cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ReactShaderToy } from '@/components/agents-ui/react-shader-toy';

const fs = `void mainImage(out vec4 color, in vec2 coord) {
  color = vec4(iTime + iResolution.x);
}`;
const fsWithValue = fs.replace('iTime +', 'uValue + iTime +');

describe('ReactShaderToy paused rendering', () => {
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

  it('draws a paused shader once, then redraws changed uniforms and size without a loop', () => {
    const { rerender } = render(
      <ReactShaderToy fs={fsWithValue} paused uniforms={{ uValue: { type: '1f', value: 1 } }} />,
    );
    frame(); // initialize
    frame(); // draw
    expect(gl.drawArrays).toHaveBeenCalledTimes(1);
    expect(frames.size).toBe(0);
    expect(gl.uniform1f).toHaveBeenCalledWith({ name: 'iTime' }, 0);
    rerender(
      <ReactShaderToy fs={fsWithValue} paused uniforms={{ uValue: { type: '1f', value: 2 } }} />,
    );
    frame();
    expect(gl.uniform1f).toHaveBeenCalledWith({ name: 'uValue' }, 2);
    expect(gl.drawArrays).toHaveBeenCalledTimes(2);
    expect(frames.size).toBe(0);
    act(() => window.dispatchEvent(new Event('resize')));
    frame();
    expect(gl.drawArrays).toHaveBeenCalledTimes(3);
    expect(frames.size).toBe(0);
  });

  it('resumes one loop and freezes it again without advancing time while paused', () => {
    const { rerender } = render(<ReactShaderToy fs={fs} paused />);
    frame();
    frame();
    rerender(<ReactShaderToy fs={fs} />);
    visibility(true);
    visibility(true);
    expect(frames.size).toBe(1);
    frame();
    frame();
    expect(frames.size).toBe(1);
    const time = gl.uniform1f.mock.calls
      .filter(([location]) => (location as { name: string }).name === 'iTime')
      .at(-1)?.[1];
    expect(time).toBeGreaterThan(0);
    rerender(<ReactShaderToy fs={fs} paused />);
    timestamp += 10000;
    frame();
    expect(frames.size).toBe(0);
    expect(gl.uniform1f).toHaveBeenLastCalledWith({ name: 'iTime' }, time);
  });

  it('keeps shader time advancing across animated uniform updates', () => {
    const { rerender } = render(
      <ReactShaderToy fs={fsWithValue} uniforms={{ uValue: { type: '1f', value: 1 } }} />,
    );
    frame();
    frame();
    rerender(<ReactShaderToy fs={fsWithValue} uniforms={{ uValue: { type: '1f', value: 2 } }} />);
    frame();
    expect(gl.uniform1f).toHaveBeenLastCalledWith({ name: 'iTime' }, 0.016);
  });

  it('redraws a paused canvas on re-entry but never starts an animation loop', () => {
    const { rerender } = render(
      <ReactShaderToy fs={fsWithValue} paused uniforms={{ uValue: { type: '1f', value: 1 } }} />,
    );
    frame();
    frame();
    visibility(false);
    rerender(
      <ReactShaderToy fs={fsWithValue} paused uniforms={{ uValue: { type: '1f', value: 3 } }} />,
    );
    expect(frames.size).toBe(0);
    visibility(true);
    visibility(true);
    expect(frames.size).toBe(1);
    frame();
    expect(gl.uniform1f).toHaveBeenCalledWith({ name: 'uValue' }, 3);
    expect(frames.size).toBe(0);
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
