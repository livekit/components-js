import { RoomAgentDispatch, RoomConfiguration, TokenSourceRequest, TokenSourceResponse } from '@livekit/protocol';
import { decodeJwt, JWTPayload } from 'jose';
import { Mutex } from 'livekit-client';

const ONE_SECOND_IN_MILLISECONDS = 1000;
const ONE_MINUTE_IN_MILLISECONDS = 60 * ONE_SECOND_IN_MILLISECONDS;


export type CamelToSnakeCase<Str extends string> = Str extends `${infer First}${infer Rest}`
  ? `${First extends Capitalize<First> ? '_' : ''}${Lowercase<First>}${CamelToSnakeCase<Rest>}`
  : Str;

type ArrayValuesToSnakeCase<Item> = Array<ValueToSnakeCase<Item>>;

type ObjectKeysToSnakeCase<Obj> = {
  [Key in keyof Obj as CamelToSnakeCase<string & Key>]: NonNullable<ValueToSnakeCase<Obj[Key]>>;
};

export type ValueToSnakeCase<Value> =
  Value extends Array<infer Item>
    ? ArrayValuesToSnakeCase<Item>
    : Value extends object
      ? ObjectKeysToSnakeCase<Value>
      : Value;


export type TokenSourceResponseObject = Required<NonNullable<ConstructorParameters<typeof TokenSourceResponse>[0]>>;

type RoomConfigurationPayload = NonNullable<ConstructorParameters<typeof RoomConfiguration>[0]>;






export abstract class TokenSourceBase {
  abstract generate(): Promise<TokenSourceResponseObject>;
}

export abstract class TokenSourceInFlexible extends TokenSourceBase {}

export type TokenSourceOptions = {
  roomName?: string;
  participantName?: string;
  participantIdentity?: string;
  participantMetadata?: string;
  participantAttributes?: { [key: string]: string };

  agentName?: string;
};

export abstract class TokenSourceFlexible extends TokenSourceBase {
  abstract setOptions(options: TokenSourceOptions): void;
  abstract clearOptions(): void;
}





function isResponseExpired(response: TokenSourceResponse) {
  const jwtPayload = decodeTokenPayload(response.participantToken);
  if (!jwtPayload?.exp) {
    return true;
  }
  const expInMilliseconds = jwtPayload.exp * ONE_SECOND_IN_MILLISECONDS;
  const expiresAt = new Date(expInMilliseconds - ONE_MINUTE_IN_MILLISECONDS);

  const now = new Date();
  return expiresAt >= now;
}

type TokenPayload = JWTPayload & {
  name?: string;
  metadata?: string;
  attributes?: Record<string, string>;
  video?: {
    room?: string;
    roomJoin?: boolean;
    canPublish?: boolean;
    canPublishData?: boolean;
    canSubscribe?: boolean;
  };
  roomConfig?: RoomConfigurationPayload,
};

function decodeTokenPayload(token: string) {
  const payload = decodeJwt<Omit<TokenPayload, 'roomConfig'>>(token);

  const { roomConfig, ...rest } = payload;

  const mappedPayload: TokenPayload = {
    ...rest,
    roomConfig: payload.roomConfig
      ? RoomConfiguration.fromJson(payload.roomConfig as Record<string, any>) as RoomConfigurationPayload
      : undefined,
  };

  return mappedPayload;
}

export abstract class TokenSourceRefreshable extends TokenSourceFlexible {
  private options: TokenSourceOptions = {};

  private cachedResponse: TokenSourceResponse | null = null;
  private fetchMutex = new Mutex();

  protected isSameAsCachedOptions(options: TokenSourceOptions) {
    if (options.roomName !== this.options.roomName) {
      return false;
    }
    if (options.participantName !== this.options.participantName) {
      return false;
    }
    if (options.participantIdentity !== this.options.participantIdentity) {
      return false;
    }
    if (options.participantMetadata !== this.options.participantMetadata) {
      return false;
    }
    if (options.participantAttributes !== this.options.participantAttributes) {
      return false;
    }
    if (options.agentName  !== this.options.agentName) {
      return false;
    }

    return true;
  }

  getJwtPayload() {
    if (!this.cachedResponse) {
      return null;
    }
    return decodeTokenPayload(this.cachedResponse.participantToken);
  }

  setOptions(options: TokenSourceOptions) {
    if (!this.isSameAsCachedOptions(options)) {
      this.cachedResponse = null;
    }
    this.options = options;
  }

  clearOptions() {
    this.options = {};
    this.cachedResponse = null;
  }

  async generate(): Promise<TokenSourceResponseObject> {
    if (this.cachedResponse && !isResponseExpired(this.cachedResponse)) {
      return this.cachedResponse!.toJson() as TokenSourceResponseObject;
    }

    const unlock = await this.fetchMutex.lock();
    try {
      const tokenResponse = await this.update(this.options);
      this.cachedResponse = tokenResponse;
      return tokenResponse;
    } finally {
      unlock();
    }
  }

  abstract update(options: TokenSourceOptions): Promise<TokenSourceResponse>;
}





type LiteralOrFn = TokenSourceResponseObject | (() => TokenSourceResponseObject | Promise<TokenSourceResponseObject>);
export class TokenSourceLiteral extends TokenSourceInFlexible {
  private literalOrFn: LiteralOrFn;

  constructor(literalOrFn: LiteralOrFn) {
    super();
    this.literalOrFn = literalOrFn;
  }

  async generate(): Promise<TokenSourceResponseObject> {
    if (typeof this.literalOrFn === 'function') {
      return this.literalOrFn();
    } else {
      return this.literalOrFn;
    }
  }
}


type CustomFn = (options: TokenSourceOptions) => TokenSourceResponseObject | Promise<TokenSourceResponseObject>;

class TokenSourceCustom extends TokenSourceRefreshable {
  private customFn: CustomFn;
  constructor(customFn: CustomFn) {
    super();
    this.customFn = customFn;
  }

  async update(options: TokenSourceOptions) {
    const resultMaybePromise = this.customFn(options);

    let result;
    if (resultMaybePromise instanceof Promise) {
      result = await resultMaybePromise;
    } else {
      result = resultMaybePromise;
    }

    return TokenSourceResponse.fromJson(result, {
      // NOTE: it could be possible that the response body could contain more fields than just
      // what's in TokenSourceResponse depending on the implementation (ie, SandboxTokenServer)
      ignoreUnknownFields: true,
    });
  }
}


export type EndpointOptions = Omit<RequestInit, 'body'>;

class TokenSourceEndpoint extends TokenSourceRefreshable {
  private url: string;
  private endpointOptions: EndpointOptions;

  constructor(url: string, options: EndpointOptions = {}) {
    super();
    this.url = url;
    this.endpointOptions = options;
  }

  async update(options: TokenSourceOptions) {
    // NOTE: I don't like the repetitive nature of this, `options` shouldn't be a thing,
    // `request` should just be passed through instead...
    const request = new TokenSourceRequest();
    request.roomName = options.roomName;
    request.participantName = options.participantName;
    request.participantIdentity = options.participantIdentity;
    request.participantMetadata = options.participantMetadata;
    request.participantAttributes = options.participantAttributes ?? {};
    request.roomConfig = options.agentName ? (
      new RoomConfiguration({
        agents: [
          new RoomAgentDispatch({
            agentName: options.agentName,
            metadata: '', // FIXME: how do I support this? Maybe make agentName -> agentToDispatch?
          }),
        ],
      })
    ) : undefined;

    const response = await fetch(this.url, {
      ...this.endpointOptions,
      method: this.endpointOptions.method ?? 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.endpointOptions.headers,
      },
      body: request.toJsonString(),
    });

    if (!response.ok) {
      throw new Error(
        `Error generating token from endpoint ${this.url}: received ${response.status} / ${await response.text()}`,
      );
    }

    const body = await response.json();
    return TokenSourceResponse.fromJson(body, {
      // NOTE: it could be possible that the response body could contain more fields than just
      // what's in TokenSourceResponse depending on the implementation (ie, SandboxTokenServer)
      ignoreUnknownFields: true,
    });
  }
}

export type SandboxTokenServerOptions = {
  baseUrl?: string;
};

export class TokenSourceSandboxTokenServer extends TokenSourceEndpoint {
  constructor(sandboxId: string, options: SandboxTokenServerOptions) {
    const { baseUrl = 'https://cloud-api.livekit.io', ...rest } = options;

    super(`${baseUrl}/api/v2/sandbox/connection-details`, {
      ...rest,
      headers: {
        'X-Sandbox-ID': sandboxId,
      },
    });
  }
}

export const TokenSource = {
  /** TokenSource.literal contains a single, literal set of credentials. */
  literal(literalOrFn: LiteralOrFn) {
    return new TokenSourceLiteral(literalOrFn);
  },

  /**
   * TokenSource.custom allows a user to define a manual function which generates new
   * {@link ResponsePayload} values on demand.
   *
   * Use this to get credentials from custom backends / etc.
   */
  custom(customFn: CustomFn) {
    return new TokenSourceCustom(customFn);
  },

  /**
   * TokenSource.endpoint creates a token source that fetches credentials from a given URL using
   * the standard endpoint format:
   * FIXME: add docs link here in the future!
   */
  endpoint(url: string, options: EndpointOptions = {}) {
    return new TokenSourceEndpoint(url, options);
  },

  /**
   * TokenSource.sandboxTokenServer queries a sandbox token server for credentials,
   * which supports quick prototyping / getting started types of use cases.
   *
   * This token provider is INSECURE and should NOT be used in production.
   *
   * For more info:
   * @see https://cloud.livekit.io/projects/p_/sandbox/templates/token-server
   */
  sandboxTokenServer(sandboxId: string, options: SandboxTokenServerOptions) {
    return new TokenSourceSandboxTokenServer(sandboxId, options);
  },
};
