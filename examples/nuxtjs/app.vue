<script setup>
  import {HelloWorld, LiveKitRoom, useToken, Participants} from "@livekit/components-vue";

  const token = ref(undefined);
  const connect = true;

  onMounted(async () => {
    token.value = await useToken('/api/livekit/token', 'test-room', 'test-user');
    console.log(token.value);
  })

  watch(token, (tk) => console.log("token changed", tk));

</script>


<template>
  <HelloWorld/>
  <div>
    <LiveKitRoom v-model:token="token" serverUrl="wss://lukastry.livekit.cloud" :connect="connect">
      LiveKit Room
      <Participants></Participants>
    </LiveKitRoom>
  </div>
</template>
