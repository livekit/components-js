import type { NextPage } from 'next';
import { useRouter } from 'next/router';

const Home: NextPage = () => {
  const router = useRouter();
  const startMeeting = () => {
    router.push(`/rooms/${generateRoomId()}`);
  };

  return (
    <main>
      <h2>LiveKit Meet</h2>
      <button onClick={startMeeting}>Start Meeting</button>
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
