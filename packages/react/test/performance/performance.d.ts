import { row } from './performance_test_utils';

declare module 'vitest' {
  export interface TestContext {
    onRender: React.ProfilerOnRenderCallback;
    logNote: (note: string) => void;
    logs: ReturnType<typeof row>[];
  }
}
