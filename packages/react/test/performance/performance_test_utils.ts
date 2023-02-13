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
  function logNote(note: string) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    /** @ts-ignore */
    context.logs.push({ id: note, phase: '---', actualDuration: '---', baseDuration: '---' });
  }

  context.onRender = logRenderResults;
  context.logNote = logNote;
  context.logs = [];
  global.ResizeObserver = ResizeObserver;
  return context;
};

/**
 * Simple helper function to be used in conjunction with the <Profiler> component.
 * Copy and past when needed.
 *
 * @param id - The string id prop of the <Profiler> tree that has just committed. This lets you identify which part of the tree was committed if you are using multiple profilers.
 * @param phase - "mount", "update" or "nested-update". This lets you know whether the tree has just been mounted for the first time or re-rendered due to a change in props, state, or hooks.
 * @param actualDuration - The number of milliseconds spent rendering the <Profiler> and its descendants for the current update. This indicates how well the subtree makes use of memoization (e.g. memo and useMemo). Ideally this value should decrease significantly after the initial mount as many of the descendants will only need to re-render if their specific props change.
 * @param baseDuration - The number of milliseconds estimating how much time it would take to re-render the entire <Profiler> subtree without any optimizations. It is calculated by summing up the most recent render durations of each component in the tree. This value estimates a worst-case cost of rendering (e.g. the initial mount or a tree with no memoization). Compare actualDuration against it to see if memoization is working.
 *
 * @see https://beta.reactjs.org/reference/react/Profiler#onrender-parameters
 */
export const onRenderLog: React.ProfilerOnRenderCallback = (
  id,
  phase,
  actualDuration,
  baseDuration,
  // startTime,
  // commitTime,
  // intersections,
) =>
  console.log(
    `[onRender|${id}](${phase}): ${actualDuration.toFixed(2)}ms | (base: ${baseDuration.toFixed(
      2,
    )}ms)`,
  );
