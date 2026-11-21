import { Room } from 'livekit-client';
import { TextStreamData } from '@livekit/components-core';
/** @beta */
export type UseTextStreamOptions = {
    room?: Room;
};
/**
 * @beta
 * @param topic - the topic to listen to
 * @returns an array of TextStreamData that holds the text, participantInfo, and streamInfo
 * @example
 * ```tsx
 * const { textStreams } = useTextStream('my-topic');
 * return <div>{textStreams.map((textStream) => textStream.text)}</div>;
 * ```
 */
export declare function useTextStream(topic: string, options?: UseTextStreamOptions): {
    textStreams: TextStreamData[];
};
//# sourceMappingURL=useTextStream.d.ts.map