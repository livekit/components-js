import { useParticipantContext } from '../contexts';
import React, { ReactNode, useEffect, useMemo, useState } from 'react';
import { Participant, TrackPublication } from 'livekit-client';

import { cloneSingleChild, useObservableState } from '../utils';
import { ParticipantView } from './participant/Participant';
import { createPublicationsObservable } from '@livekit/components-core';

type PublicationChild = ReactNode & {
  publication: TrackPublication;
  participant: Participant;
};

type ParticipantPub = {
  publication: TrackPublication;
  participant: Participant;
};

type PublicationsProps<T extends PublicationChild> = {
  children: T;
  participant?: Participant;
  filterDependencies?: Array<unknown>;
  filter?: (publication: Array<ParticipantPub>) => Array<TrackPublication>;
};

export function usePublications(
  filter?: (publication: Array<ParticipantPub>) => Array<TrackPublication>,
  filterDependencies?: any,
  participant?: Participant,
) {
  const p = participant ?? useParticipantContext();
  const observable = useMemo(() => createPublicationsObservable(p), [p]);
  const publications = useObservableState(observable, p.getTracks());
  const [filteredPublications, setFilteredPublications] = useState(publications);
  useEffect(() => {
    if (filter) {
      setFilteredPublications((pubs) =>
        filter(
          pubs.map((pub) => {
            return { participant: p, publication: pub };
          }),
        ),
      );
    }
  }, [publications, filter, ...filterDependencies]);
  return filteredPublications;
}

export function Publications<T extends PublicationChild>({
  children,
  participant,
  filter,
  filterDependencies,
}: PublicationsProps<T>) {
  const publications = usePublications(filter, filterDependencies, participant);
  return (
    <>
      {publications.map((pub) =>
        children ? (
          cloneSingleChild(children, { publication: pub, participant, key: pub.trackSid })
        ) : (
          <ParticipantView />
        ),
      )}
    </>
  );
}
