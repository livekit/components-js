import { TrackReference } from '@livekit/components-core';
import React from 'react';
import { LayoutContextType, useEnsureLayoutContext } from '../context';

export function usePinnedTracks(layoutContext?: LayoutContextType): TrackReference[] {
  layoutContext = useEnsureLayoutContext(layoutContext);
  return React.useMemo(() => {
    if (layoutContext?.pin.state !== undefined && layoutContext.pin.state.length >= 1) {
      return layoutContext.pin.state;
    }
    return [];
  }, [layoutContext]);
}
