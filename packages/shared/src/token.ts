// import { decodeJwt } from 'jose';
import { AccessToken, TokenVerifier, VideoGrant } from 'livekit-server-sdk';

export type Grant = VideoGrant;

const apiKey = process.env.LK_API_KEY;
const apiSecret = process.env.LK_API_SECRET;

// export const decodeToken = (token: string) => decodeJwt(token);

export const verifyToken = (token: string) => {
  const verifier = new TokenVerifier(apiKey!, apiSecret!);
  return verifier.verify(token);
};

export const createToken = (participantIdentity: string, grant: Grant) => {
  const at = new AccessToken(apiKey, apiSecret, {
    identity: participantIdentity,
  });

  at.addGrant(grant);

  return at.toJwt();
};
