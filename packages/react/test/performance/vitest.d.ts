import { Row } from './performance_test_utils';

declare module 'vitest' {
  export interface TestContext {
    onRender: React.ProfilerOnRenderCallback;
    logs: (typeof Row)[];
  }
}
