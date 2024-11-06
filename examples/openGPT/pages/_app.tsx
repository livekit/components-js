import type { AppProps } from 'next/app.js';
import '@livekit/components-styles';
import '@livekit/components-styles/prefabs';
import '../styles/globals.css';
import '../styles/theme.scss';

function MyApp({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}

export default MyApp;
