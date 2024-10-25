'use client';

import { LiveKitRoom } from '@livekit/components-react';
import { setLogLevel, LogLevel, Room } from 'livekit-client';
import { useMemo, useState, useCallback } from 'react';
import { generateRandomUserId } from '../lib/helper';

// Set the log level for both packages
setLogLevel("debug");

const MinimalExample = () => {
  const [room] = useState(() => new Room({}));
  const [token, setToken] = useState<string>();
  const [connect, setConnect] = useState(false);
  const [error, setError] = useState<string>();
  
  // Validate and get server URL and token endpoint
  const { serverUrl, tokenEndpoint } = useMemo(() => {
    const url = process.env.NEXT_PUBLIC_LK_SERVER_URL;
    const endpoint = process.env.NEXT_PUBLIC_LK_TOKEN_ENDPOINT || '/api/livekit/token';
    
    if (!url) {
      console.error('NEXT_PUBLIC_LK_SERVER_URL is not set');
      return { serverUrl: undefined, tokenEndpoint: endpoint };
    }
    
    try {
      // Ensure URL starts with ws:// or wss://
      const formattedUrl = !url.startsWith('ws://') && !url.startsWith('wss://') 
        ? `wss://${url}` 
        : url;
        
      return { 
        serverUrl: formattedUrl,
        tokenEndpoint: endpoint
      };
    } catch (e) {
      console.error('Invalid server URL:', e);
      return { serverUrl: undefined, tokenEndpoint: endpoint };
    }
  }, []);
  
  // Memoize params with explicit window check
  const params = useMemo(() => {
    if (typeof window === 'undefined') return null;
    return new URLSearchParams(window.location.search);
  }, []);
  
  const roomName = useMemo(() => params?.get('room') ?? 'test-room', [params]);
  const identity = useMemo(() => params?.get('user') ?? generateRandomUserId(), [params]);

  // Fetch token using your existing endpoint
  const getToken = useCallback(async () => {
    if (!tokenEndpoint) {
      setError('Token endpoint not configured');
      return;
    }

    try {
      setError(undefined);
      const response = await fetch(
        `${tokenEndpoint}?roomName=${encodeURIComponent(roomName)}&identity=${encodeURIComponent(identity)}&name=${encodeURIComponent(identity)}`
      );
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || response.statusText);
      }
      
      const data = await response.json();
      if (!data.accessToken) {
        throw new Error('Token response missing accessToken');
      }
      
      setToken(data.accessToken);
      setConnect(true);
    } catch (e) {
      console.error('Error fetching token:', e);
      setError(e instanceof Error ? e.message : 'Failed to get access token');
      setConnect(false);
    }
  }, [tokenEndpoint, roomName, identity]);

  const handleDisconnect = useCallback(() => {
    setConnect(false);
    setToken(undefined);
    setError(undefined);
  }, []);

  if (!serverUrl) {
    return <div>Server URL not configured</div>;
  }

  return (
    <div data-lk-theme="default" style={{ height: '100vh' }}>
      {error && (
        <div style={{ color: 'red', padding: '1rem', margin: '1rem 0' }}>
          Error: {error}
        </div>
      )}
      
      {!token && (
        <div style={{ padding: '1rem' }}>
          <button 
            onClick={getToken} 
            className="lk-button"
            disabled={!serverUrl || !tokenEndpoint}
          >
            Connect to Room: {roomName}
          </button>
        </div>
      )}
      
      {token && serverUrl && (
        <LiveKitRoom
          video={false}
          audio={false}
          token={token}
          serverUrl={serverUrl}
          room={room}
          connect={connect}
          onDisconnected={handleDisconnect}
          onError={(err) => {
            console.error('LiveKit error:', err);
            setError(err instanceof Error ? err.message : 'Connection failed');
            handleDisconnect();
          }}
        >
          <div style={{ padding: '1rem' }}>
            Connected to room: {roomName}
          </div>
        </LiveKitRoom>
      )}
    </div>
  );
};

export default MinimalExample;
