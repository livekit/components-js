import React, { HTMLAttributes } from 'react';
// import { useParticipantContext } from './ParticipantRenderer';

export const ConnectionQuality = (props: HTMLAttributes<HTMLDivElement>) => {
  const { className, ...rest } = props;
  // const participantState = useParticipantContext();
  const signalClassName = '';

  return (
    <div className={className + ` ${signalClassName}`} {...rest}>
      <div className="lk-signal-bar"></div>
      <div className="lk-signal-bar"></div>
      <div className="lk-signal-bar"></div>
    </div>
  );
};
