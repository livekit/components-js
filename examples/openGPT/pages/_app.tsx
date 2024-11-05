import type { AppProps } from 'next/app.js';
import '@livekit/components-styles';
import '../styles/globals.css';

function MyApp({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}

export default MyApp;
