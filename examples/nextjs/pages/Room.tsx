import { useEffect, useState } from 'react';
export const Room = (props: any) => {
  const [, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      // @ts-ignore
      import('@livekit/components/dist/livekit-components.mjs');
      setLoaded(true);
    })();
  }, []);

  return (
    <>
      {/** @ts-ignore */}
      <livekit-room connect={props.connect} url="test" token="none">
        {props.children} {/** @ts-ignore */}
      </livekit-room>
    </>
  );
};
