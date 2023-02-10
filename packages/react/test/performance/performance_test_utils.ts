import { cleanup } from '@testing-library/react';
import { TestContext } from 'vitest';
import ResizeObserver from 'resize-observer-polyfill';

export function Row(
  id: string,
  phase: 'mount' | 'update',
  actualDuration: number,
  baseDuration: number,
) {
  this.id = id;
  this.phase = phase;
  this.actualDuration = `${actualDuration.toFixed(4)}ms`;
  this.baseDuration = `${baseDuration.toFixed(4)}ms`;
}

/**
 * @see https://beta.reactjs.org/reference/react/Profiler#onrender-parameters
 */
export const afterEachPerformanceTest = async (context: TestContext) => {
  console.log(`\n==> Render times for: ${context.meta.name}`);
  console.table(context.logs);
  cleanup();
};

export const beforeEachPerformanceTest = async (context: TestContext) => {
  function logRenderResults(
    id: string,
    phase: 'mount' | 'update',
    actualDuration: number,
    baseDuration: number,
  ) {
    context.logs.push(new Row(id, phase, actualDuration, baseDuration));
  }
  context.onRender = logRenderResults;
  context.logs = [];
  global.ResizeObserver = ResizeObserver;
  return context;
};
