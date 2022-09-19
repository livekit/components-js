import type { Room } from 'livekit-client';
import { getContext, setContext } from 'svelte';

export const roomContextKey = `lk-room-context`;

export const setRoomContext = (room: Room) => setContext(roomContextKey, room);
export const getRoomContext = () => getContext(roomContextKey) as Room;
