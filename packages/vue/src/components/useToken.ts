import { onMounted, ref, watchEffect } from 'vue';

export function useToken(
  apiEndpoint: string,
  roomName: string,
  identity: string,
  name?: string,
  metadata?: string,
) {
  const token = ref(undefined);
  const isMounted = ref(false);
  onMounted(() => {
    isMounted.value = true;
  });
  watchEffect(async () => {
    if (isMounted.value) {
      console.log('fetching token');
      const res = await fetch(
        apiEndpoint +
          `?roomName=${roomName}&identity=${identity}&name=${name}&metadata=${metadata}`,
      );
      const json = await res.json();
      console.log('token', json, res);
      token.value = json.accessToken;
    }
  });
  return token;
}
