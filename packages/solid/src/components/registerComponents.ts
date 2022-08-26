import { customElement } from 'solid-element';
import LiveKitParticipant from './LiveKitParticipant';
import { LiveKitRoom } from './LiveKitRoom';

export function registerWebComponents() {
  customElement('livekit-room', { connect: false, url: '', token: '' }, LiveKitRoom);
  customElement('livekit-participant', LiveKitParticipant);
}
