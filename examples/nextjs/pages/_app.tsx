import '../styles/globals.css';
import type { AppProps } from 'next/app';
import '@livekit/components-styles/theme';
import '@livekit/components-styles/layout';

function MyApp({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}

export default MyApp;
