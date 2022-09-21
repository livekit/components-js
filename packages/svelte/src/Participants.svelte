<script lang="ts">
  import { connectedParticipantsObserver } from '@livekit/components-core';
  import type { Participant } from 'livekit-client';
  import { getRoomContext } from './contexts';

  export let filter: (participants: Participant[]) => Participant[] = (participants) =>
    participants;

  const participants = connectedParticipantsObserver(getRoomContext());

  $: filteredParticipants = filter($participants);
</script>

{#each filteredParticipants as participant (participant.identity)}
  <slot {participant} />
{/each}
