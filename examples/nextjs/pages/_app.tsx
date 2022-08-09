import '../styles/globals.css';
import type { AppProps } from 'next/app';
import { RoomProvider } from '@livekit/auth-helpers-nextjs';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <RoomProvider>
      <Component {...pageProps} />
    </RoomProvider>
  );
}

export default MyApp;
