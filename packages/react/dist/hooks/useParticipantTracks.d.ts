import { TrackReference } from '@livekit/components-core';
import { Room, Track } from 'livekit-client';
type UseParticipantTracksOptions = {
    participantIdentity?: string;
    room?: Room;
};
/**
 * `useParticipantTracks` is a custom React that allows you to get tracks of a specific participant only, by specifiying the participant's identity.
 * If the participant identity is not passed the hook will try to get the participant from a participant context.
 * @public
 */
export declare function useParticipantTracks<TrackSource extends Track.Source>(sources: Array<TrackSource>, optionsOrParticipantIdentity?: UseParticipantTracksOptions | UseParticipantTracksOptions['participantIdentity']): Array<TrackReference>;
export {};
//# sourceMappingURL=useParticipantTracks.d.ts.map