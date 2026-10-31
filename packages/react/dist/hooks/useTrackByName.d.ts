import { Participant } from 'livekit-client';
/**
 * This function `useTrackByName` allows you to access a track by referencing its track name.
 * Inside the function, it ensures that the a valid `participant` reference is available by checking
 * for both a passed participant argument and, if not available, a valid participant context.
 *
 * @public
 */
export declare function useTrackByName(name: string, participant?: Participant): import('@livekit/components-core').TrackReferenceOrPlaceholder;
//# sourceMappingURL=useTrackByName.d.ts.map