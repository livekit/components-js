import { participantAttributesObserver } from '@livekit/components-core';
import type { Participant } from 'livekit-client';
import * as React from 'react';
import { useEnsureParticipant, useMaybeParticipantContext } from '../context';
import { useObservableState } from './internal';

/**
 * The `useParticipantAttributes` hook returns the attributes of a given participant and allows to set them.
 * It requires a `Participant` object passed as property or via the `ParticipantContext`.
 *
 * @example
 * ```tsx
 * const { attributes } = useParticipantAttributes({ participant });
 * ```
 * @public
 */
export interface UseParticipantAttributesOptions {
  participant?: Participant;
}

/** @public */
export function useParticipantAttributes(props: UseParticipantAttributesOptions = {}) {
  const participantContext = useMaybeParticipantContext();
  const p = props.participant ?? participantContext;
  const attributeObserver = React.useMemo(
    // weird typescript constraint
    () => (p ? participantAttributesObserver(p) : participantAttributesObserver(p)),
    [p],
  );
  const attributeState = useObservableState(attributeObserver, {
    attributes: p?.attributes,
  });

  return attributeState;
}

/**
 * The `useParticipantAttribute` hook returns the latest value of a given attribute key of a participant.
 * It requires a `Participant` object passed as property in the `UseParticipantAttributesOptions` or via the `ParticipantContext`.
 *
 * @example
 * ```tsx
 * const myAttributeValue = useParticipantAttribute('targetAttributeName');
 * ```
 * @public
 */
export function useParticipantAttribute(
  attributeKey: string,
  options: UseParticipantAttributesOptions = {},
) {
  const p = useEnsureParticipant(options.participant);
  const [attribute, setAttribute] = React.useState(p.attributes[attributeKey]);

  React.useEffect(() => {
    if (!p) {
      return;
    }
    const subscription = participantAttributesObserver(p).subscribe((val) => {
      if (val.changed[attributeKey] !== undefined) {
        setAttribute(val.attributes[attributeKey]);
      }
    });
    return () => {
      subscription.unsubscribe();
    };
  }, [p, attributeKey]);

  return attribute;
}
