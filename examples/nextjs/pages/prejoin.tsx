'use client';

import * as React from 'react';
import { PreJoin, setLogLevel } from '@livekit/components-react';
import type { NextPage } from 'next';

const PreJoinExample: NextPage = () => {
  const [visible, setVisible] = React.useState(true);
  setLogLevel('debug', { liveKitClientLogLevel: 'warn' });

  return (
    <div data-lk-theme="default" style={{ height: '100vh' }}>
      <button onClick={() => setVisible((val) => !val)}>Toggle PreJoin</button>
      {visible && (
        <PreJoin
          defaults={{ videoDeviceId: '' }}
          onSubmit={(values) => {
            values.audioDeviceId;
          }}
          onValidate={(values) => {
            return true;
          }}
        />
      )}
    </div>
  );
};

export default PreJoinExample;
