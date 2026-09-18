import { AccessToken, RoomAgentDispatch, RoomConfiguration } from 'livekit-server-sdk';

export interface AgentTokenEnv {
  LIVEKIT_URL?: string;
  LIVEKIT_API_KEY?: string;
  LIVEKIT_API_SECRET?: string;
  AGENT_NAME?: string;
}

/**
 * Mints a LiveKit AccessToken for the `AgentSessionView-01` story, dispatching the configured
 * agent into a freshly-created room. Shared by the Vercel Preview API route
 * (`token.ts`) and the local Storybook dev-server middleware (`.storybook/main.js`).
 */
export async function createAgentToken(env: AgentTokenEnv) {
  const LIVEKIT_URL = env.LIVEKIT_URL;
  const API_KEY = env.LIVEKIT_API_KEY;
  const API_SECRET = env.LIVEKIT_API_SECRET;
  const AGENT_NAME = env.AGENT_NAME;

  if (LIVEKIT_URL === undefined || LIVEKIT_URL === '') {
    throw new Error('LIVEKIT_URL is not defined');
  }
  if (API_KEY === undefined || API_KEY === '') {
    throw new Error('LIVEKIT_API_KEY is not defined');
  }
  if (API_SECRET === undefined || API_SECRET === '') {
    throw new Error('LIVEKIT_API_SECRET is not defined');
  }

  const participantName = 'user';
  const participantIdentity = `voice_assistant_user_${Math.floor(Math.random() * 10_000)}`;
  const roomName = `voice_assistant_room_${Math.floor(Math.random() * 10_000)}`;
  const token = new AccessToken(API_KEY, API_SECRET, {
    identity: participantIdentity,
    name: participantName,
    ttl: '15m',
  });

  token.addGrant({
    room: roomName,
    roomJoin: true,
    canPublish: true,
    canPublishData: true,
    canSubscribe: true,
  });

  token.roomConfig = new RoomConfiguration({
    agents: [new RoomAgentDispatch({ agentName: AGENT_NAME })],
  });

  return {
    server_url: LIVEKIT_URL,
    room_name: roomName,
    participant_name: participantName,
    participant_token: await token.toJwt(),
  };
}
