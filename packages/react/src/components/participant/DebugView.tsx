import * as React from 'react';
import { JSONTree } from 'react-json-tree';
import type { DebugTrackInfo } from './MediaTrack';

export const DebugView = ({ debugInfo }: { debugInfo?: DebugTrackInfo }) => {
  //   React.useEffect(() => {
  //     import('react-json-tree').then((value) => setJSONTree(value.JSONTree));
  //   }, []);

  console.log(debugInfo);

  return (
    <div style={{ position: 'absolute', width: '90%', height: '90%', overflow: 'auto' }}>
      {typeof JSONTree !== 'undefined' && debugInfo && <JSONTree data={debugInfo} />}
    </div>
  );
};
