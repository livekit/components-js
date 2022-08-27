import React from 'react';
import { useParticipantContext } from './ParticipantRenderer';
import styles from '../Participant.module.css';

export const ConnectionQuality = () => {
  const participantState = useParticipantContext();
  const signalClassName = participantState
    ? styles[participantState?.connectionQuality.toString()]
    : '';
  return (
    <div className={styles['signal-icon'] + ` ${signalClassName}`}>
      <div className={styles['signal-bar']}></div>
      <div className={styles['signal-bar']}></div>
      <div className={styles['signal-bar']}></div>
    </div>
  );
};
