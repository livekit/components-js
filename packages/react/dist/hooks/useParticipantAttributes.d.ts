import { Participant } from 'livekit-client';
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
export declare function useParticipantAttributes(props?: UseParticipantAttributesOptions): {
    attributes: Readonly<Record<string, string>> | undefined;
};
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
export declare function useParticipantAttribute(attributeKey: string, options?: UseParticipantAttributesOptions): string;
//# sourceMappingURL=useParticipantAttributes.d.ts.map