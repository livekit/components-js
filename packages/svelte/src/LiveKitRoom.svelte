<script lang="ts">
	import { setRoomContext } from "./contexts";
    import {Room, type RoomOptions} from "livekit-client";
	import { onMount } from "svelte";


	export let serverUrl: string;
	export let token: string;
	export let connect: boolean = true;
    export let options: RoomOptions = {};

    const room = new Room(options);

    let isMounted = false;

    $: isMounted && connect ? room.connect(serverUrl, token) : room.disconnect();
    setRoomContext(room);

    onMount(() => {
        isMounted = true;
    })


</script>

<slot />
