import React, { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFeatureContext } from '../context';
import Draggable from 'react-draggable';
import { unstable_batchedUpdates } from 'react-dom';
import { usePinnedTracks } from '../hooks';
import { TrackReferenceOrPlaceholder } from '@cc-livekit/components-core';
import { Track } from 'livekit-client';

const videoWidth = 150;
const videoHeight = 150;

export const DraggableWrapper: FC<any> = (props) => {
  const featureFlags = useFeatureContext();
  const ref = useRef<HTMLDivElement>(null);

  const pinnedTracks = usePinnedTracks();

  const draggable = useMemo(() => {
    if (featureFlags?.type === '1on1') {
      const screenShareTracks = pinnedTracks.filter(
        (track: TrackReferenceOrPlaceholder) => track.source === Track.Source.ScreenShare,
      );
      if (screenShareTracks.length === 1) {
        return false;
      } else {
        return true;
      }
    } else {
      return false;
    }
  }, [featureFlags?.type, pinnedTracks]);

  const [position, setPosition] = useState({
    x: 0,
    y: document.body.clientHeight - videoHeight - 69 - 16 - 32,
    direction: 'left',
  });

  const getNewDirection = useCallback(
    (data: any) => {
      const middleX = (document.body.clientWidth - videoWidth) / 2;
      return data.lastX < middleX ? 'left' : 'right';
    },
    [position],
  );

  // https://github.com/react-grid-layout/react-draggable/issues/363
  useEffect(() => {
    const fakeMouseMove = () => {
      if (ref.current) {
        ['mousedown', 'mousemove', 'mouseup'].forEach((evtName) => {
          ref.current?.dispatchEvent(
            new Event(evtName, {
              bubbles: true,
              cancelable: true,
            }),
          );
        });
      }
    };

    window.addEventListener('resize', fakeMouseMove);

    return () => {
      window.removeEventListener('resize', fakeMouseMove);
    };
  }, []);

  if (!draggable) return props.children;

  return (
    <Draggable
      position={position}
      defaultClassName="draggable-wrapper"
      bounds=".adapt-1on1-call"
      onDrag={(_, data) => {
        setPosition((info: any) => ({
          ...info,
          x: data.x,
          y: data.y,
        }));
      }}
      onStop={(_, data) => {
        const newDirection = getNewDirection(data);
        unstable_batchedUpdates(() => {
          setPosition({
            x: newDirection === 'left' ? 0 : document.body.clientWidth - videoWidth - 16,
            y: data.lastY,
            direction: newDirection,
          });
        });
      }}
    >
      <div ref={ref} className="draggable-ref-node">
        {props.children}
      </div>
    </Draggable>
  );
};
