import styles from './page.module.css';
import { LiveKitRoom } from '@livekit/components-react';

export default function Home() {
  return (
    <main className={styles.main}>
      <LiveKitRoom serverUrl="" token=""></LiveKitRoom>
    </main>
  );
}
