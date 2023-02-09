import * as React from 'react';
import { describe, it } from 'vitest';
import { render, screen } from '@testing-library/react';
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
const onRender: React.ProfilerOnRenderCallback = (id, phase, actualDuration, baseDuration) => {
  const table = new Row(id, phase, actualDuration, baseDuration);

  console.table([table]);
};

describe('Basic performance test setup', () => {
  it('Test render time', () => {
    render(
      <Profiler id="hello-world" onRender={onRender}>
        {Array.from(new Array(1)).map((e, i) => (
          <button key={`${e}-${i}`}>Hello World</button>
        ))}
      </Profiler>,
    );

    screen.debug();
  });
});
