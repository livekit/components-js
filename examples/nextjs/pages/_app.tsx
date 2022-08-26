import '../styles/globals.css';
import type { AppProps } from 'next/app';
import '@livekit/auth-helpers-nextjs/dist/auth-helpers-nextjs.cjs.development.css';

function MyApp({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}

export default MyApp;
