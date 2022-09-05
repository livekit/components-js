import React, { HTMLAttributes, useEffect, useMemo, useState } from 'react';
import { ConnectionQualityInterface } from '@livekit/components-core';
import { useParticipantContext } from '../contexts';
import { ConnectionQuality, Participant } from 'livekit-client';
import { mergeProps } from '../utils';

interface ConnectionIndicatorProps extends HTMLAttributes<HTMLDivElement> {}

export const useConnectionQuality = (
  props?: ConnectionIndicatorProps,
  participant?: Participant,
) => {
  const p = participant ?? useParticipantContext();
  const [quality, setQuality] = useState(ConnectionQuality.Unknown);
  const [qualityClassName, setQualityClassName] = useState('');

  const { staticProps, createConnectionQualityObserver } = useMemo(() => {
    const { className } = ConnectionQualityInterface.setup();
    const { createConnectionQualityObserver } = ConnectionQualityInterface.observers();
    return {
      staticProps: mergeProps(props, { className }),
      createConnectionQualityObserver,
    };
  }, []);

  useEffect(() => {
    const subscription = createConnectionQualityObserver(p).subscribe(({ quality, class_ }) => {
      setQuality(quality);
      setQualityClassName(class_);
    });
    return () => {
      subscription.unsubscribe();
    };
  }, [p]);

  const elementProps = useMemo(
    () => mergeProps(props, staticProps, { className: qualityClassName }),
    [qualityClassName, props, staticProps],
  );

  return { elementProps, quality };
};

/**
 * Display the connection quality of a given participant.
 */
export const ConnectionIndicator = (props: ConnectionIndicatorProps) => {
  const { elementProps } = useConnectionQuality(props);
  return <div {...elementProps}>{props.children}</div>;
};
