/**
 * Print a LiveKit access token the mock will accept. Same AccessToken pattern as
 * examples/nextjs/pages/api/livekit/token.ts.
 *
 *   pnpm token                       # default room/identity
 *   pnpm token my-session alice      # room (the fallback sessionId) and identity
 */

import { AccessToken } from 'livekit-server-sdk';

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    console.error(`${name} must be set (copy .env.example to .env)`);
    process.exit(1);
  }
  return value;
}

export async function mintToken(room: string, identity: string): Promise<string> {
  const token = new AccessToken(requireEnv('LIVEKIT_API_KEY'), requireEnv('LIVEKIT_API_SECRET'), {
    identity,
    ttl: '1h',
  });
  token.addGrant({
    room,
    roomJoin: true,
    canPublish: true,
    canPublishData: true,
    canSubscribe: true,
    // The mock can be told to require this one via MOCK_REQUIRE_GRANT.
    canManageAgentSession: true,
  });
  return token.toJwt();
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  process.stdout.write(
    await mintToken(process.argv[2] ?? 'mock-session', process.argv[3] ?? 'mock-user'),
  );
}
