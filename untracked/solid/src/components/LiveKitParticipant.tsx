import type { Participant } from 'livekit-client';
import { Component, useContext } from 'solid-js';
import { useRoom } from './LiveKitRoom';

const LiveKitParticipant = (props: { participant: Participant }) => {
  const roomState = useRoom();
  const participant = roomState.room.localParticipant;
  console.log(participant);
  return <div>{participant.identity ?? 'no identity'}</div>;
};

export default LiveKitParticipant;
