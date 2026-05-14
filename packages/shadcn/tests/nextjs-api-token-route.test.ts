import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const routeMocks = vi.hoisted(() => ({
  accessTokenInstances: [] as any[],
  roomConfigurationFromJson: vi.fn((value: unknown) => ({ type: 'room-config', value })),
}));

vi.mock('next/server', () => ({
  NextResponse: class MockNextResponse extends Response {
    static json(data: unknown, init?: ResponseInit) {
      return new Response(JSON.stringify(data), init);
    }
  },
}));

vi.mock('livekit-server-sdk', () => ({
  AccessToken: class MockAccessToken {
    args: unknown[];
    addGrant = vi.fn();
    toJwt = vi.fn(async () => 'participant-token');
    roomConfig: unknown;

    constructor(...args: unknown[]) {
      this.args = args;
      routeMocks.accessTokenInstances.push(this);
    }
  },
}));

vi.mock('@livekit/protocol', () => ({
  RoomConfiguration: class MockRoomConfiguration {
    static fromJson = routeMocks.roomConfigurationFromJson;
  },
}));

async function importRoute(env: Record<string, string | undefined> = {}) {
  vi.resetModules();
  routeMocks.accessTokenInstances.length = 0;
  routeMocks.roomConfigurationFromJson.mockClear();

  vi.stubEnv('NODE_ENV', env.NODE_ENV ?? 'development');
  vi.stubEnv('LIVEKIT_URL', env.LIVEKIT_URL);
  vi.stubEnv('LIVEKIT_API_KEY', env.LIVEKIT_API_KEY);
  vi.stubEnv('LIVEKIT_API_SECRET', env.LIVEKIT_API_SECRET);

  return import('@/components/agents-ui/nextjs-api-token-route');
}

describe('nextjs-api-token-route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('exports revalidate set to zero', async () => {
    const route = await importRoute();

    expect(route.revalidate).toBe(0);
  });

  it('throws outside development mode', async () => {
    const { POST } = await importRoute({
      NODE_ENV: 'production',
      LIVEKIT_URL: 'wss://livekit.example',
      LIVEKIT_API_KEY: 'api-key',
      LIVEKIT_API_SECRET: 'api-secret',
    });

    await expect(
      POST(new Request('https://example.test/token', { method: 'POST' })),
    ).rejects.toThrow('THIS API ROUTE IS INSECURE');
  });

  it('returns a 500 response when required environment variables are missing', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { POST } = await importRoute({
      LIVEKIT_API_KEY: 'api-key',
      LIVEKIT_API_SECRET: 'api-secret',
    });

    const response = await POST(new Request('https://example.test/token', { method: 'POST' }));

    expect(response).toBeInstanceOf(Response);
    expect(response?.status).toBe(500);
    await expect(response?.text()).resolves.toBe('LIVEKIT_URL is not defined');
    expect(errorSpy).toHaveBeenCalledWith(expect.any(Error));
  });

  it('creates a participant token and returns connection details', async () => {
    vi.spyOn(Math, 'random').mockReturnValueOnce(0.1234).mockReturnValueOnce(0.5678);
    const { POST } = await importRoute({
      LIVEKIT_URL: 'wss://livekit.example',
      LIVEKIT_API_KEY: 'api-key',
      LIVEKIT_API_SECRET: 'api-secret',
    });

    const response = await POST(
      new Request('https://example.test/token', {
        method: 'POST',
        body: JSON.stringify({}),
      }),
    );
    const data = await response?.json();

    expect(data).toEqual({
      serverUrl: 'wss://livekit.example',
      roomName: 'voice_assistant_room_5678',
      participantName: 'user',
      participantToken: 'participant-token',
    });
    expect(response?.headers.get('Cache-Control')).toBe('no-store');

    const token = routeMocks.accessTokenInstances[0];
    expect(token.args).toEqual([
      'api-key',
      'api-secret',
      {
        identity: 'voice_assistant_user_1234',
        name: 'user',
        ttl: '15m',
      },
    ]);
    expect(token.addGrant).toHaveBeenCalledWith({
      room: 'voice_assistant_room_5678',
      roomJoin: true,
      canPublish: true,
      canPublishData: true,
      canSubscribe: true,
    });
    expect(token.roomConfig).toBeInstanceOf(Object);
  });

  it('parses room_config from the request body', async () => {
    const roomConfig = { agents: [{ agentName: 'support' }] };
    const { POST } = await importRoute({
      LIVEKIT_URL: 'wss://livekit.example',
      LIVEKIT_API_KEY: 'api-key',
      LIVEKIT_API_SECRET: 'api-secret',
    });

    await POST(
      new Request('https://example.test/token', {
        method: 'POST',
        body: JSON.stringify({ room_config: roomConfig }),
      }),
    );

    expect(routeMocks.roomConfigurationFromJson).toHaveBeenCalledWith(roomConfig, {
      ignoreUnknownFields: true,
    });
    expect(routeMocks.accessTokenInstances[0].roomConfig).toEqual({
      type: 'room-config',
      value: roomConfig,
    });
  });
});
