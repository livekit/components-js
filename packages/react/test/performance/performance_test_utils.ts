import { cleanup } from '@testing-library/react';
import { TestContext } from 'vitest';

export function Row(id, phase, actualDuration, baseDuration) {
  this.id = id;
  this.phase = phase;
  this.actualDuration = `${actualDuration.toFixed(4)}ms`;
  this.baseDuration = `${baseDuration.toFixed(4)}ms`;
}

export interface PerformanceTestContext {
  onRender: React.ProfilerOnRenderCallback;
  logs: (typeof Row)[];
  meta: TestContext['meta'];
}

/**
 * @see https://beta.reactjs.org/reference/react/Profiler#onrender-parameters
 */

export const afterEachPerformanceTest = async (context: PerformanceTestContext) => {
  console.log(`\n==> Render results for: ${context.meta.name}`);
  console.table(context.logs);
  cleanup();
};

export const beforeEachPerformanceTest = async (context: PerformanceTestContext) => {
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
  return context;
};
