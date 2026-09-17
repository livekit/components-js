/**
 * Environment parsing. One frozen object, read once at startup so a misconfiguration
 * fails immediately rather than on the first request.
 */

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `${name} must be set. Copy .env.example to .env and fill it in -- any dev ` +
        `key/secret pair works, the mock never talks to LiveKit Cloud.`,
    );
  }
  return value;
}

function int(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return fallback;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`${name} must be a non-negative integer, got ${JSON.stringify(raw)}`);
  }
  return parsed;
}

function list(name: string, fallback: string[]): string[] {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return fallback;
  const items = raw
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  return items.length > 0 ? items : fallback;
}

export const config = Object.freeze({
  apiKey: required('LIVEKIT_API_KEY'),
  apiSecret: required('LIVEKIT_API_SECRET'),
  port: int('PORT', 8787),
  endpoints: list('MOCK_ENDPOINTS', ['fare-desk']),
  agentDescription:
    process.env.MOCK_AGENT_DESCRIPTION || 'Answers fare, baggage and change-fee questions.',
  eventDelayMs: int('MOCK_EVENT_DELAY_MS', 250),
  defaultScenario: process.env.MOCK_SCENARIO || 'full',
  /** Optional VideoGrant field that must be present on the token. Empty = no gate. */
  requireGrant: process.env.MOCK_REQUIRE_GRANT || '',
  /** SSE keepalive comment interval. Node won't time a stream out, but proxies will. */
  heartbeatMs: int('MOCK_HEARTBEAT_MS', 20_000),
  /**
   * Text the expert says at the top of every task, as a session.say() message: a real
   * chat item, carrying lk/verbatim. Empty disables it.
   */
  a2aGreeting:
    process.env.MOCK_A2A_GREETING === undefined
      ? 'Fetching data, please wait'
      : process.env.MOCK_A2A_GREETING,
});

export type Config = typeof config;
