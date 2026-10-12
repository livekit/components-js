import { UseSessionReturn } from '../hooks';
import * as React from 'react';
/** @beta */
export type SessionProviderProps = {
    session: UseSessionReturn;
    children: React.ReactNode;
};
/**
 * The `SessionProvider` component instantiates a SessionContext from the return of useSession
 * @beta
 */
export declare function SessionProvider(props: SessionProviderProps): React.JSX.Element;
//# sourceMappingURL=SessionProvider.d.ts.map