import { describe, it, expect, afterEach } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { useShaderColor } from '@/hooks/agents-ui/use-shader-color';

const FALLBACK = '#1FD5F9';
const FALLBACK_RGB = [0x1f / 255, 0xd5 / 255, 0xf9 / 255];

function ShaderColor({ color }: { color: string }) {
  const { rgb, probe } = useShaderColor(color, FALLBACK);
  return (
    <div data-testid="shader" data-rgb={JSON.stringify(rgb)}>
      {probe && (
        <span hidden style={probe.parentStyle}>
          <span ref={probe.ref} style={probe.style} />
        </span>
      )}
    </div>
  );
}

const rgb = () => JSON.parse(screen.getByTestId('shader').dataset.rgb ?? '[]');

afterEach(() => {
  document.documentElement.className = '';
});

describe('useShaderColor', () => {
  it('converts a hex color without a probe', () => {
    render(<ShaderColor color="#ff8000" />);

    expect(rgb()).toEqual([1, 0x80 / 255, 0]);
    expect(screen.getByTestId('shader')).toBeEmptyDOMElement();
  });

  it('converts a three-digit hex color', () => {
    render(<ShaderColor color="#f80" />);
    expect(rgb()).toEqual([1, 0x88 / 255, 0]);
  });

  it("reads other colors from the probe's computed color", () => {
    render(<ShaderColor color="rgb(255, 0, 0)" />);
    expect(rgb()).toEqual([1, 0, 0]);
  });

  it('reads the color again when the page theme changes', async () => {
    render(<ShaderColor color="rgb(255, 0, 0)" />);
    expect(rgb()).toEqual([1, 0, 0]);

    // Stands in for a theme variable resolving to a new value under `.dark`
    const probe = screen.getByTestId('shader').querySelector<HTMLElement>('span span')!;
    probe.style.color = 'rgb(0, 0, 255)';
    await act(async () => {
      document.documentElement.classList.add('dark');
      await Promise.resolve();
    });
    expect(rgb()).toEqual([0, 0, 1]);
  });

  it('reads the color again when a wrapper around it changes theme', async () => {
    render(
      <div data-testid="wrapper">
        <ShaderColor color="rgb(255, 0, 0)" />
      </div>,
    );
    const probe = screen.getByTestId('shader').querySelector<HTMLElement>('span span')!;

    probe.style.color = 'rgb(0, 0, 255)';
    await act(async () => {
      screen.getByTestId('wrapper').setAttribute('data-theme', 'dark');
      await Promise.resolve();
    });
    expect(rgb()).toEqual([0, 0, 1]);
  });

  it('ignores theme changes elsewhere on the page', async () => {
    const elsewhere = document.createElement('div');
    document.body.appendChild(elsewhere);
    render(<ShaderColor color="rgb(255, 0, 0)" />);
    const probe = screen.getByTestId('shader').querySelector<HTMLElement>('span span')!;

    probe.style.color = 'rgb(0, 0, 255)';
    await act(async () => {
      elsewhere.setAttribute('data-theme', 'dark');
      await Promise.resolve();
    });
    expect(rgb()).toEqual([1, 0, 0]);
    elsewhere.remove();
  });

  it("uses the fallback for a color the browser can't use", () => {
    render(<ShaderColor color="#12345" />);
    expect(rgb()).toEqual(FALLBACK_RGB);
  });

  it('uses the fallback for a transparent color', () => {
    render(<ShaderColor color="rgba(255, 0, 0, 0)" />);
    expect(rgb()).toEqual(FALLBACK_RGB);
  });
});
