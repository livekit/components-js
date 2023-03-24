import React from 'react';
import { useLayoutContext } from '../context';

export function usePinnedTracks() {
  const layoutContext = useLayoutContext();
  return React.useMemo(() => {
    if (layoutContext?.pin.state !== undefined && layoutContext.pin.state.length >= 1) {
      return layoutContext.pin.state;
    }
    return undefined;
  }, [layoutContext]);
}
