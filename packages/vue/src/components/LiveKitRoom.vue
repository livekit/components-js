


<script lang="ts" setup>
    import { provide, toRefs } from 'vue';
    import { useRoom, RoomContextKey } from './useRoom';

    const props = defineProps({
        token: {type: String},
        serverUrl: {type: String},
        connect: Boolean
    });

    const {connect, token, serverUrl} = toRefs(props);

    const room = useRoom({ connect, token, serverUrl });

    provide(RoomContextKey, room);
</script>


<template>
    <slot></slot>
</template>
