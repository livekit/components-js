import { UseParticipantInfoOptions } from '../../hooks';
import * as React from 'react';
/** @public */
export interface ParticipantNameProps extends React.HTMLAttributes<HTMLSpanElement>, UseParticipantInfoOptions {
}
/**
 * The `ParticipantName` component displays the name of the participant as a string within an HTML span element.
 * If no participant name is undefined the participant identity string is displayed.
 *
 * @example
 * ```tsx
 * <ParticipantName />
 * ```
 * @public
 */
export declare const ParticipantName: (props: ParticipantNameProps & React.RefAttributes<HTMLSpanElement>) => React.ReactNode;
//# sourceMappingURL=ParticipantName.d.ts.map