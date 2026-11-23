/** @public */
export interface UserInfo {
    identity?: string;
    name?: string;
    metadata?: string;
}
/** @public */
export interface UseTokenOptions {
    userInfo?: UserInfo;
}
/**
 * The `useToken` hook fetches a token from the given token endpoint with the given user info.
 *
 * @example
 * ```tsx
 * const token = useToken(<token-endpoint>, roomName, { userInfo: { identity, name }});
 * ```
 * @public */
export declare function useToken(tokenEndpoint: string | undefined, roomName: string, options?: UseTokenOptions): string | undefined;
//# sourceMappingURL=useToken.d.ts.map