import React from 'react';
import { useParticipant } from './ParticipantRenderer';
import styles from '../Participant.module.css';

export const ConnectionQuality = () => {
  const participantState = useParticipant();
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
