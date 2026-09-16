/**
 * Bearer auth.
 *
 * The design doc does not say how the LiveKit token travels -- s3 only notes that "an
 * auth scheme, or a second interface, needs a real AgentCard from the a2a module". This
 * mock assumes `Authorization: Bearer <livekit-jwt>`, which is what the agent card it
 * publishes declares (an HTTP bearer scheme with bearerFormat JWT), and verifies the
 * signature with the same api key/secret that minted it.
 */

import type { Request, RequestHandler, Response } from 'express';
import { TokenVerifier } from 'livekit-server-sdk';
import type { ClaimGrants } from 'livekit-server-sdk';
import { config } from './config.ts';

export function unauthorized(res: Response, message: string): void {
  res.status(401).json({ error: { code: 'UNAUTHENTICATED', message } });
}

export function forbidden(res: Response, message: string): void {
  res.status(403).json({ error: { code: 'PERMISSION_DENIED', message } });
}

export function grantsOf(res: Response): ClaimGrants | undefined {
  return res.locals.grants as ClaimGrants | undefined;
}

/**
 * s4 leaves the channel-to-conversation mapping to dispatch rather than the protocol
 * ("that mapping belongs to dispatch, and not to the protocol"). For a browser client the
 * token's room grant is the closest thing to a conversation id, so it stands in when a
 * request omits sessionId.
 */
export function sessionIdHint(res: Response): string | undefined {
  return grantsOf(res)?.video?.room || undefined;
}

export function callerIdentity(res: Response): string | undefined {
  return grantsOf(res)?.sub;
}

export function bearerAuth(): RequestHandler {
  const verifier = new TokenVerifier(config.apiKey, config.apiSecret);

  return (req: Request, res: Response, next): void => {
    const header = (req.get('authorization') ?? '').trim();
    const match = /^Bearer\s+(.+)$/i.exec(header);
    if (!match) {
      unauthorized(
        res,
        'expected an "Authorization: Bearer <livekit-jwt>" header; run `pnpm token` for one',
      );
      return;
    }

    verifier
      .verify(match[1])
      .then((grants) => {
        if (config.requireGrant) {
          const video = (grants.video ?? {}) as unknown as Record<string, unknown>;
          if (!video[config.requireGrant]) {
            forbidden(
              res,
              `token is missing the ${config.requireGrant} video grant (MOCK_REQUIRE_GRANT)`,
            );
            return;
          }
        }
        res.locals.grants = grants;
        next();
      })
      .catch((err: unknown) => {
        // Covers a bad signature, a wrong api key and an expired token alike.
        unauthorized(res, `token rejected: ${(err as Error).message}`);
      });
  };
}
