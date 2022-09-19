<script lang="ts">
    import {ConnectionState, LiveKitRoom} from "@livekit/components-svelte";
    const serverUrl = import.meta.env.VITE_PUBLIC_LK_SERVER_URL;
    const devToken = import.meta.env.VITE_PUBLIC_LK_DEV_TOKEN;
</script>

<LiveKitRoom serverUrl={serverUrl} token={devToken}>
    <ConnectionState/>
</LiveKitRoom>
