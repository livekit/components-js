import '../styles/globals.css';
import type { AppProps } from 'next/app';
import '@livekit/components-styles/dist/styles.css';

function MyApp({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}

export default MyApp;
