import { AdaptiveStreamSettings, AudioCaptureOptions, AudioOutputOptions, E2EEOptions, Room as OriginalRoom, ReconnectPolicy, RoomConnectOptions, TokenSourceConfigurable, TokenSourceFetchOptions, TokenSourceFixed, TokenSourceResponseObject, TrackPublishDefaults, VideoCaptureOptions, WebAudioSettings } from "livekit-client";

interface InternalRoomOptionsBase {
  /**
   * AdaptiveStream lets LiveKit automatically manage quality of subscribed
   * video tracks to optimize for bandwidth and CPU.
   * When attached video elements are visible, it'll choose an appropriate
   * resolution based on the size of largest video element it's attached to.
   *
   * When none of the video elements are visible, it'll temporarily pause
   * the data flow until they are visible again.
   */
  adaptiveStream: AdaptiveStreamSettings | boolean;

  /**
   * enable Dynacast, off by default. With Dynacast dynamically pauses
   * video layers that are not being consumed by any subscribers, significantly
   * reducing publishing CPU and bandwidth usage.
   *
   * Dynacast will be enabled if SVC codecs (VP9/AV1) are used. Multi-codec simulcast
   * requires dynacast
   */
  dynacast: boolean;

  /**
   * default options to use when capturing user's audio
   */
  audioCaptureDefaults?: AudioCaptureOptions;

  /**
   * default options to use when capturing user's video
   */
  videoCaptureDefaults?: VideoCaptureOptions;

  /**
   * default options to use when publishing tracks
   */
  publishDefaults?: TrackPublishDefaults;

  /**
   * audio output for the room
   */
  audioOutput?: AudioOutputOptions;

  /**
   * should local tracks be stopped when they are unpublished. defaults to true
   * set this to false if you would prefer to clean up unpublished local tracks manually.
   */
  stopLocalTrackOnUnpublish: boolean;

  /**
   * policy to use when attempting to reconnect
   */
  reconnectPolicy: ReconnectPolicy;

  /**
   * specifies whether the sdk should automatically disconnect the room
   * on 'pagehide' and 'beforeunload' events
   */
  disconnectOnPageLeave: boolean;

  /**
   * @internal
   * experimental flag, introduce a delay before sending signaling messages
   */
  expSignalLatency?: number;

  /**
   * mix all audio tracks in web audio, helps to tackle some audio auto playback issues
   * allows for passing in your own AudioContext instance, too
   */

  webAudioMix: boolean | WebAudioSettings;

  // /**
  //  * @deprecated Use `encryption` field instead.
  //  */
  e2ee?: E2EEOptions;

  /**
   * @experimental
   * Options for enabling end-to-end encryption.
   */
  encryption?: E2EEOptions;

  loggerName?: string;
}

type RoomOptionsBase = Partial<Omit<InternalRoomOptionsBase, 'encryption'>>;

/**
 * This type isn't necesarily required but helps guide users in an editor against accidentally
 * including token source fetch options in the room constructor params for "fixed" token sources.
 * Otherwise since the Room constructor `Options` generic "extends" RoomOptions, extra fields could
 * be included.
 */
type BlockTokenSourceFetchOptions = { [P in keyof TokenSourceFetchOptions]: never };

export type RoomOptionsLegacyOrTokenSourceFixed = RoomOptionsBase & BlockTokenSourceFetchOptions;
export type RoomOptionsTokenSourceConfigurable = RoomOptionsBase & Partial<TokenSourceFetchOptions>;

/** Given two TokenSourceFetchOptions values, check to see if they are deep equal. */
export function areTokenSourceFetchOptionsEqual(a: TokenSourceFetchOptions, b: TokenSourceFetchOptions) {
  for (const key of Object.keys(a) as Array<keyof TokenSourceFetchOptions>) {
    switch (key) {
      case 'roomName':
      case 'participantName':
      case 'participantIdentity':
      case 'participantMetadata':
      case 'participantAttributes':
      case 'agentName':
      case 'agentMetadata':
        if (a[key] !== b[key]) {
          return false;
        }
        break;
      default:
        // ref: https://stackoverflow.com/a/58009992
        const exhaustiveCheckedKey: never = key;
        throw new Error(`Options key ${exhaustiveCheckedKey} not being checked for equality!`);
    }
  }

  return true;
}

export function extractTokenSourceFetchOptionsFromObject<
  Rest extends object,
  Input extends TokenSourceFetchOptions & Rest = TokenSourceFetchOptions & Rest,
>(input: Input): [TokenSourceFetchOptions, Rest] {
  const output: Partial<Input> = { ...input };
  const options: TokenSourceFetchOptions = {};

  for (const key of Object.keys(input) as Array<keyof TokenSourceFetchOptions>) {
    switch (key) {
      case 'roomName':
      case 'participantName':
      case 'participantIdentity':
      case 'participantMetadata':
      case 'agentName':
      case 'agentMetadata':
        options[key] = input[key];
        delete output[key];
        break;

      case 'participantAttributes':
        options.participantAttributes = options.participantAttributes ?? {};
        delete output.participantAttributes;
        break;

      default:
        // ref: https://stackoverflow.com/a/58009992
        key satisfies never;
        break;
    }
  }

  return [options, output as Rest];
}

/**
 * Options for when creating a new room
 */
export type RoomOptions<
  TokenSource extends TokenSourceFixed | TokenSourceConfigurable | null = null,
> = TokenSource extends TokenSourceConfigurable
  ? RoomOptionsTokenSourceConfigurable
  : RoomOptionsLegacyOrTokenSourceFixed;


/**
 * In LiveKit, a room is the logical grouping for a list of participants.
 * Participants in a room can publish tracks, and subscribe to others' tracks.
 *
 * a Room fires [[RoomEvent | RoomEvents]].
 *
 * @noInheritDoc
 */
export class Room<
  RoomTokenSource extends TokenSourceFixed | TokenSourceConfigurable | null =
    | TokenSourceFixed
    | TokenSourceConfigurable
    | null,
> extends OriginalRoom {
  /** The token source passed in the constructor, or null */
  tokenSource: RoomTokenSource;

  /**
   * Creates a new Room, the primary construct for a LiveKit session.
   * @param options
   */
  constructor(tokenSource: RoomTokenSource, options?: RoomOptions<RoomTokenSource>);
  /** @deprecated */
  constructor(options?: RoomOptions);
  constructor(
    tokenSourceOrOptions?: RoomTokenSource | RoomOptions,
    optionsOrUnset?: RoomOptions<RoomTokenSource>,
  ) {
    let tokenSource: RoomTokenSource | undefined;
    let options: RoomOptions<RoomTokenSource>;
    if (
      tokenSourceOrOptions instanceof TokenSourceConfigurable ||
      tokenSourceOrOptions instanceof TokenSourceFixed
    ) {
      tokenSource = tokenSourceOrOptions;
      options = optionsOrUnset ?? {};
    } else {
      tokenSource = null as RoomTokenSource;
      options = tokenSourceOrOptions ?? {};
    }

    super(options);
    this.tokenSource = tokenSource;
  }

  private async tokenSourceFetch(): Promise<TokenSourceResponseObject | null> {
    if (this.tokenSource instanceof TokenSourceConfigurable) {
      const tokenSourceFetchOptions = extractTokenSourceFetchOptionsFromObject(this.options)[0];
      return this.tokenSource.fetch(tokenSourceFetchOptions);
    } else if (this.tokenSource instanceof TokenSourceFixed) {
      return this.tokenSource.fetch();
    } else {
      return null;
    }
  }

  /**
   * prepareConnection should be called as soon as the page is loaded, in order
   * to speed up the connection attempt. This function will
   * - perform DNS resolution and pre-warm the DNS cache
   * - establish TLS connection and cache TLS keys
   *
   * With LiveKit Cloud, it will also determine the best edge data center for
   * the current client to connect to if a token is provided.
   */
  prepareConnection: RoomTokenSource extends TokenSourceFixed | TokenSourceConfigurable
    ? {
        (): Promise<void>;
      }
    : {
        (url: string, token?: string): Promise<void>;
      } = async (urlOrUnset?: string, tokenOrUnset?: string) => {
    let url;
    let token;

    const tokenSourceFetchResponse = await this.tokenSourceFetch();
    if (tokenSourceFetchResponse) {
      url = tokenSourceFetchResponse.serverUrl;
      token = tokenSourceFetchResponse.participantToken;
    } else if (typeof urlOrUnset === 'string') {
      url = urlOrUnset;
      token = tokenOrUnset;
    } else {
      throw new Error(
        `Room.prepareConnection received invalid parameters - expected url, url/token or tokenSource, received ${urlOrUnset}, ${tokenOrUnset}.`,
      );
    }

    return super.prepareConnection(url, token);
  };

  connectPatched: RoomTokenSource extends TokenSourceFixed | TokenSourceConfigurable
    ? {
        (opts?: RoomConnectOptions): Promise<void>;
      }
    : {
        (url: string, token: string, opts?: RoomConnectOptions): Promise<void>;
      } = async (
    urlOrOptsOrUnset: string | RoomConnectOptions | undefined,
    tokenOrUnset?: string,
    optsOrUnset?: RoomConnectOptions,
  ) => {
    let url: string;
    let token: string;
    let opts: RoomConnectOptions | undefined;

    const tokenSourceFetchResponse = await this.tokenSourceFetch();
    if (tokenSourceFetchResponse && typeof urlOrOptsOrUnset !== 'string') {
      url = tokenSourceFetchResponse.serverUrl;
      token = tokenSourceFetchResponse.participantToken;
      opts = urlOrOptsOrUnset;
    } else if (typeof urlOrOptsOrUnset === 'string' && typeof tokenOrUnset === 'string') {
      url = urlOrOptsOrUnset;
      token = tokenOrUnset;
      opts = optsOrUnset;
    } else {
      throw new Error(
        `Room.connect received invalid parameters - expected url/token or tokenSource, received ${urlOrOptsOrUnset}, ${tokenOrUnset}, ${optsOrUnset}`,
      );
    }

    return this.connect(url, token, opts);
  };
}
