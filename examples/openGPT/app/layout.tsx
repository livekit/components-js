import type { AppProps } from 'next/app.js';
import '@livekit/components-styles';
import '@livekit/components-styles/prefabs';
import '../styles/globals.css';
import '../styles/theme.scss';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head />
      <body>{children}</body>
    </html>
  );
}
