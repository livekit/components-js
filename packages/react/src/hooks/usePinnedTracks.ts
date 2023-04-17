import type { TrackReference } from '@livekit/components-core';
import React from 'react';
import type { LayoutContextType } from '../context';
import { useEnsureLayoutContext } from '../context';

export function usePinnedTracks(layoutContext?: LayoutContextType): TrackReference[] {
  layoutContext = useEnsureLayoutContext(layoutContext);
  return React.useMemo(() => {
    if (layoutContext?.state?.pin !== undefined && layoutContext.state?.pin.length >= 1) {
      return layoutContext.state.pin;
    }
    return [];
  }, [layoutContext]);
}
