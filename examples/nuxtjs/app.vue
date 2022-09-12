<script setup>
  import {ref} from "vue";
  import {LiveKitRoom, useToken, Participants} from "@livekit/components-vue";

  const token = useToken('/api/livekit/token', 'test-room', 'test-user');
  const connect = ref(false);

  watch(token, (tk) => console.log("token changed", tk));

</script>


<template>
  <h1>Welcome to LiveKit</h1>
  <button @click="connect = true" >Connect</button>
  <div>
    <LiveKitRoom :token="token" serverUrl="wss://lukastry.livekit.cloud" :connect="connect">
      <Participants></Participants>
    </LiveKitRoom>
  </div>
</template>
