'use client';

import type { NextPage } from 'next';
import styles from '../styles/Home.module.scss';
import Head from 'next/head';

const EXAMPLE_ROUTES = {
  voiceAssistant: {
    title: 'AI Voice Assistant example',
    href: () => `/voice-assistant`,
  },
  minimal: { title: 'VideoConference example with minimal code', href: () => `/minimal` },
  simple: { title: 'Simple custom setup example', href: () => `/simple` },
  audioOnly: {
    title: 'Audio only example',
    href: () => `/audio-only`,
  },
  customize: {
    title: 'Simple example with custom components',
    href: () => `/customize`,
  },
  clubhouse: {
    title: 'Clubhouse clone build with LiveKit components',
    href: () => `/clubhouse`,
  },
  processors: {
    title: 'Example usage of @livekit/track-processors for background blur',
    href: () => `/processors`,
  },
} as const;

const Home: NextPage = () => {
  return (
    <div>
      <Head>
        <title>LiveKit Components App</title>
        <meta name="description" content="" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <header style={{ maxWidth: '48ch' }}>
          <img
            style={{ width: '100%' }}
            src="livekit-components-logo.png"
            alt="LiveKit components text logo."
          />
          <p>Some simple sample apps to help you get started working with LiveKit Components.</p>
        </header>
        <ul className="example-list">
          {Object.values(EXAMPLE_ROUTES).map(({ title, href }, index) => {
            return (
              <li className={styles.listItem} key={index}>
                <a className={styles.link} href={href()}>
                  {title}
                </a>
              </li>
            );
          })}
        </ul>
      </main>
    </div>
  );
};

export default Home;
