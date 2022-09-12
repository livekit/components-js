<script lang="ts" setup>
    import { watch } from 'vue';
import { useParticipants } from './useParticipants';
    const participants = useParticipants();

    watch(participants, (p) => console.log("participants updated", p.length))
</script>