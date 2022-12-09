import * as React from 'react';
interface UserInfo {
  identity?: string;
  name?: string;
  metadata?: string;
}

export interface UseTokenProps {
  tokenEndpoint?: string;
  roomName: string;
  userInfo?: UserInfo;
}

export function useToken({ tokenEndpoint, userInfo, roomName }: UseTokenProps) {
  const [token, setToken] = React.useState<string | undefined>(undefined);

  React.useEffect(() => {
    if (tokenEndpoint === undefined) {
      throw Error('token endpoint needs to be defined');
    }
    if (userInfo?.identity === undefined) {
      return;
    }
    const tokenFetcher = async () => {
      console.log('fetching token');
      const params = new URLSearchParams({ ...userInfo, roomName });
      const res = await fetch(`${tokenEndpoint}?${params.toString()}`);
      const { accessToken } = await res.json();
      setToken(accessToken);
    };
    tokenFetcher();
  }, [tokenEndpoint, roomName, userInfo]);
  return token;
}
