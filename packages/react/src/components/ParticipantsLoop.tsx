import { Participant, Track } from 'livekit-client';
import * as React from 'react';
import { ParticipantContext } from '../contexts';
import { useParticipants } from '../hooks';
import { cloneSingleChild } from '../utils';
import { ParticipantView } from './participant/ParticipantView';
import { useScreenShare } from './ScreenShareRenderer';

type ParticipantsLoopProps = {
  /**
   * Set to `true` if screen share tracks should be included in the participant loop?
   */
  includeScreenShares?: boolean;
  filterDependencies?: Array<unknown>;
  filter?: (participants: Array<Participant>) => Array<Participant>;
};

/**
 * The ParticipantsLoop component loops over all or a filtered subset of participants to create a visual
 * representation (`ParticipantView`) and context for every participant. This component takes zero or more children.
 * By providing your own `ParticipantView` template as a child you have full control over the look and feel of your
 * participant representations. If no child is provided we render a basic video tile representation for every participant.
 *
 * @remarks
 * Super detailed documentation.
 *
 * @example
 * ```tsx
 * {...}
 *   <ParticipantsLoop>
 *     {...}
 *   <ParticipantsLoop />
 * {...}
 * ```
 *
 * @see `ParticipantView` component
 */
export const ParticipantsLoop = ({
  filter,
  filterDependencies,
  includeScreenShares: includeScreeShares = true,
  ...props
}: React.PropsWithChildren<ParticipantsLoopProps>) => {
  const participants = useParticipants({ filter, filterDependencies });
  //TODO: Remove useScreenShare as a way to trigger re-render after scree share has stopped.
  const { allScreenShares, screenShareParticipant } = useScreenShare({});

  type TrackSourceParticipantPair = { source: Track.Source; participant: Participant };

  const participantSourceMix: TrackSourceParticipantPair[] = React.useMemo(() => {
    const mix: TrackSourceParticipantPair[] = [];
    console.log({ allScreenShares });

    participants.forEach((p) => {
      mix.push({ source: Track.Source.Camera, participant: p });
      if (p.isScreenShareEnabled) {
        mix.push({ source: Track.Source.ScreenShare, participant: p });
      }
    });
    return mix;
  }, [participants, allScreenShares, screenShareParticipant]);

  return (
    <>
      {participantSourceMix.map(({ source, participant }) => (
        <ParticipantContext.Provider value={participant} key={participant.identity}>
          {props.children ? (
            cloneSingleChild(props.children)
          ) : (
            <ParticipantView trackSource={source} />
          )}
        </ParticipantContext.Provider>
      ))}
    </>
  );
};
