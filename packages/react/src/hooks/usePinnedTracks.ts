import type { TrackReferenceOrPlaceholder } from '@livekit/components-core';
import * as React from 'react';
import type { LayoutContextType } from '../context';
import { useEnsureLayoutContext } from '../context';

export function usePinnedTracks(layoutContext?: LayoutContextType): TrackReferenceOrPlaceholder[] {
  layoutContext = useEnsureLayoutContext(layoutContext);
  return React.useMemo(() => {
    if (layoutContext?.state?.pin !== undefined && layoutContext.state?.pin.length >= 1) {
      return layoutContext.state.pin;
    }
    return [];
  }, [layoutContext]);
}
