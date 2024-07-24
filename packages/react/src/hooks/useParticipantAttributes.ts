import { participantAttributesObserver } from '@livekit/components-core';
import type { Participant } from 'livekit-client';
import * as React from 'react';
import { useEnsureParticipant } from '../context';
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
  const p = useEnsureParticipant(props.participant);
  const attributeObserver = React.useMemo(() => participantAttributesObserver(p), [p]);
  const { attributes } = useObservableState(attributeObserver, {
    attributes: p.attributes,
  });

  return { attributes };
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
    const subscription = participantAttributesObserver(p).subscribe((val) => {
      if (val.changed[attributeKey] !== undefined) {
        setAttribute(val.changed[attributeKey]);
      }
    });
    return () => {
      subscription.unsubscribe();
    };
  }, [p, attributeKey]);

  return attribute;
}
