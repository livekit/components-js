import { SKIP_PERFORMANCE_TESTS } from '../env';
import * as React from 'react';
import { describe, it, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Profiler } from 'react';
import { afterEachPerformanceTest, beforeEachPerformanceTest } from './performance_test_utils';

describe.skipIf(SKIP_PERFORMANCE_TESTS)('Basic performance test setup', () => {
  beforeEach((context) => {
    beforeEachPerformanceTest(context);
  });
  afterEach((context) => {
    afterEachPerformanceTest(context);
  });

  it('Test render time with no interaction', ({ onRender }) => {
    render(
      <Profiler id="hello-world" onRender={onRender}>
        {Array.from(new Array(1)).map((e, i) => (
          <button key={`${e}-${i}`}>Hello World</button>
        ))}
      </Profiler>,
    );

    screen.debug();
  });

  it('Test render time with button click', async (context) => {
    const Component = () => {
      const [, setState] = React.useState(0);
      return <button onClick={() => setState((value) => value + 1)}>Button</button>;
    };
    render(
      <Profiler id="click" onRender={context.onRender}>
        <Component />
      </Profiler>,
    );

    const button = screen.getByText('Button');
    await userEvent.click(button);
    await userEvent.click(button);
    await userEvent.click(button);
    await userEvent.click(button);
    await userEvent.click(button);
    await userEvent.click(button);
    await userEvent.click(button);
  });
});
