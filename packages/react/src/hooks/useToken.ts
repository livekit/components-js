import { log } from '@livekit/components-core';
import * as React from 'react';

/** @public */
export interface UserInfo {
  identity?: string;
  name?: string;
  metadata?: string;
}

/** @public */
export interface UseTokenOptions {
  userInfo?: UserInfo;
}

/**
 * The `useToken` hook fetches a token from the given token endpoint with the given user info.
 *
 * @example
 * ```tsx
 * const token = useToken(<token-endpoint>, roomName, { userInfo: { identity, name }});
 * ```
 * @public */
export function useToken(
  tokenEndpoint: string | undefined,
  roomName: string,
  options: UseTokenOptions = {},
) {
  const [token, setToken] = React.useState<string | undefined>(undefined);

  React.useEffect(() => {
    if (tokenEndpoint === undefined) {
      throw Error('token endpoint needs to be defined');
    }
    if (options.userInfo?.identity === undefined) {
      return;
    }
    const tokenFetcher = async () => {
      log.debug('fetching token');
      const params = new URLSearchParams({ ...options.userInfo, roomName });
      const res = await fetch(`${tokenEndpoint}?${params.toString()}`);
      if (!res.ok) {
        log.error(
          `Could not fetch token. Server responded with status ${res.status}: ${res.statusText}`,
        );
        return;
      }
      const { accessToken } = await res.json();
      setToken(accessToken);
    };
    tokenFetcher();
  }, [tokenEndpoint, roomName, JSON.stringify(options)]);
  return token;
}
