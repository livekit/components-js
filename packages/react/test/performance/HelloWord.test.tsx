import * as React from 'react';
import { describe, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Profiler } from 'react';

function Row(id, phase, actualDuration, baseDuration) {
  this.id = id;
  this.phase = phase;
  this.actualDuration = `${actualDuration.toFixed(4)}ms`;
  this.baseDuration = `${baseDuration.toFixed(4)}ms`;
}

/**
 * @see https://beta.reactjs.org/reference/react/Profiler#onrender-parameters
 */
function onRender(
  id: string,
  phase: 'mount' | 'update',
  actualDuration: number,
  baseDuration: number,
): typeof Row {
  const row = new Row(id, phase, actualDuration, baseDuration);
  return row;
}

function printTable(rows) {
  console.table(rows);
}

describe('Basic performance test setup', () => {
  it('Test render time with no interaction', () => {
    render(
      <Profiler id="hello-world" onRender={onRender}>
        {Array.from(new Array(1)).map((e, i) => (
          <button key={`${e}-${i}`}>Hello World</button>
        ))}
      </Profiler>,
    );

    screen.debug();
  });
  it.only('Test render time with button click', async () => {
    const logs: (typeof Row)[] = [];
    const Component = () => {
      const [state, setState] = React.useState(0);
      return <button onClick={() => setState((value) => value + 1)}>Button</button>;
    };
    render(
      <Profiler
        id="click"
        onRender={(id, phase, actualDuration, baseDuration) =>
          logs.push(onRender(id, phase, actualDuration, baseDuration))
        }
      >
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
    printTable(logs);
  });
});
