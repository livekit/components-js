import { log } from '@livekit/components-core';
import * as React from 'react';
interface UserInfo {
  identity?: string;
  name?: string;
  metadata?: string;
}

export interface UseTokenOptions {
  userInfo?: UserInfo;
}

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
      const { accessToken } = await res.json();
      setToken(accessToken);
    };
    tokenFetcher();
  }, [tokenEndpoint, roomName, options]);
  return token;
}
