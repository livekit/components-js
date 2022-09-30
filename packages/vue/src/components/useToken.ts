import { onMounted, ref, watchEffect } from 'vue';
interface UserInfo {
  identity?: string;
  name?: string;
  metadata?: string;
}
export function useToken(apiEndpoint: string, roomName: string, userInfo?: UserInfo) {
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
          `?roomName=${roomName}&identity=${userInfo?.identity}&name=${userInfo?.name}&metadata=${userInfo?.metadata}`,
      );
      const json = await res.json();
      console.log('token', json, res);
      token.value = json.accessToken;
    }
  });
  return token;
}
