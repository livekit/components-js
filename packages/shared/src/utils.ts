import { LocalParticipant, Participant, RemoteParticipant } from 'livekit-client';
import { cssPrefix } from './constants';
export const kebabize = (str: string) =>
  str.replace(/[A-Z]+(?![a-z])|[A-Z]/g, ($, ofs) => (ofs ? '-' : '') + $.toLowerCase());

export function getCSSClassName(name: string) {
  return `${cssPrefix}-${kebabize(name)}`;
}

export const isLocal = (p: Participant) => p instanceof LocalParticipant;

export const isRemote = (p: Participant) => p instanceof RemoteParticipant;
