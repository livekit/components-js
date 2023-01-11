import { GridLayout } from '@livekit/components-react';
import type { NextPage } from 'next';
import { useRouter } from 'next/router';

const Home: NextPage = () => {
  const router = useRouter();
  const startMeeting = () => {
    router.push(`/rooms/${generateRoomId()}`);
  };

  return (
    <main
      style={{
        display: 'grid',
        placeItems: 'center',
        width: '100%',
        height: '100%',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <h1>LiveKit Meet</h1>
        <button onClick={startMeeting}>Start Meeting</button>
      </div>
    </main>
  );
};

export default Home;

function generateRoomId(): string {
  return `${randomString(4)}-${randomString(4)}`;
}

function randomString(length: number): string {
  let result = '';
  const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}
