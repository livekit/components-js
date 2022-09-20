<script lang="ts">
  import { connectionStateObserver } from '@livekit/components-core';
  import type { Room } from 'livekit-client';
  import { getRoomContext } from './contexts';

  export let room: Room | undefined = undefined;

  const connectionState = connectionStateObserver(room ?? getRoomContext());
</script>

<span>{$connectionState}</span>
