import { SKIP_PERFORMANCE_TESTS } from '../env';
import * as React from 'react';
import { describe, it, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Profiler } from 'react';
import { afterEachPerformanceTest, beforeEachPerformanceTest } from './performance_test_utils';
import { LiveKitRoom } from './../../src/components';
import { VideoConference } from './../../src/prefabs';
import { ConnectionQuality, Participant, RemoteParticipant, Room, RoomEvent } from 'livekit-client';
import { log } from '@livekit/components-core';
import { act } from 'react-dom/test-utils';

describe.skipIf(SKIP_PERFORMANCE_TESTS)('Basic performance test setup', () => {
  beforeEach((context) => {
    beforeEachPerformanceTest(context);
  });
  afterEach((context) => {
    afterEachPerformanceTest(context);
  });

  it(
    'Test VideoConference: no RoomEvents emitted',
    async ({ onRender }) =>
      new Promise<void>((done) => {
        const room = new Room();
        render(
          <Profiler id="_" onRender={onRender}>
            <LiveKitRoom token="" serverUrl="" room={room}>
              <VideoConference></VideoConference>
            </LiveKitRoom>
          </Profiler>,
        );
        done();
      }),
    100,
  );

  it(
    'Test VideoConference: RoomEvents ParticipantConnected emitted.',
    async ({ onRender, logNote }) =>
      new Promise<void>((done) => {
        const room = new Room();
        render(
          <Profiler id="room" onRender={onRender}>
            <LiveKitRoom token="" serverUrl="" room={room}>
              <VideoConference></VideoConference>
            </LiveKitRoom>
          </Profiler>,
        );
        room.on(RoomEvent.ParticipantConnected, () => {
          done();
        });
        act(() => {
          logNote('fire ParticipantConnected');
          room.emit(RoomEvent.ParticipantConnected, new RemoteParticipant());
        });
      }),
    100,
  );
  // it('Test render time with button click', async (context) => {
  //   const Component = () => {
  //     const [, setState] = React.useState(0);
  //     return (
  //       <button data-testid="button" onClick={() => setState((value) => value + 1)}>
  //         Button
  //       </button>
  //     );
  //   };
  //   render(
  //     <Profiler id="click" onRender={context.onRender}>
  //       <Component />
  //     </Profiler>,
  //   );
  //   const button = screen.getByTestId('button');
  //   await userEvent.click(button);
  //   await userEvent.click(button);
  //   await userEvent.click(button);
  //   await userEvent.click(button);
  //   await userEvent.click(button);
  //   await userEvent.click(button);
  //   await userEvent.click(button);
  // });
});
