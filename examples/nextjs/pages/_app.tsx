import '../styles/globals.css';
import type { AppProps } from 'next/app.js';
import '@livekit/components-styles';

function MyApp({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}

export default MyApp;
