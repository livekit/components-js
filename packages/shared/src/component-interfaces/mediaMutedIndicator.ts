import type { BaseSetupReturnType } from './types';
// import { map, Observable, startWith } from 'rxjs';

interface MediaMutedIndicator extends BaseSetupReturnType {}

const setup = (kind: 'audio' | 'video'): MediaMutedIndicator => {
  return {
    className:
      kind === 'audio' ? `lk-media-muted-indicator-audio` : 'lk-media-muted-indicator-video',
  };
};

// interface ObserverSetups {
//   createConnectionQualityObserver: (
//     participant: Participant,
//   ) => Observable<{ muted: boolean; class_: string }>;
// }
// const observers = (): ObserverSetups => {
//   const createConnectionQualityObserver = (participant: Participant) => {
//     const observer = observeParticipantEvents(
//       participant,
//       ParticipantEvent.ConnectionQualityChanged,
//     ).pipe(
//       map((p) => {
//         return { quality: p.connectionQuality, class_: `lk-${p.connectionQuality}` };
//       }),
//       startWith({
//         muted: true, // TODO: dynamic muted
//         class_: `lk-${participant.connectionQuality}`,
//       }),
//     );
//     return observer;
//   };
//   return { createConnectionQualityObserver };
// };

export { setup };
