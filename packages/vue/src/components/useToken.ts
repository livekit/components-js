export async function useToken(
  apiEndpoint: string,
  roomName: string,
  identity: string,
  name?: string,
  metadata?: string,
) {
  const tokenFetcher = async () => {
    console.log('fetching token');
    const res = await fetch(
      apiEndpoint + `?roomName=${roomName}&identity=${identity}&name=${name}&metadata=${metadata}`,
    );
    const json = await res.json();
    console.log('token', json, res);
    return json.accessToken;
  };
  return await tokenFetcher();
}
