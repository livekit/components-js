import { PerformanceTestContext } from './performance_test_utils';

declare module 'vitest' {
  export interface TestContext extends PerformanceTestContext {}
}
