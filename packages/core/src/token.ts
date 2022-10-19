import { AccessToken, AccessTokenOptions, TokenVerifier, VideoGrant } from 'livekit-server-sdk';

const apiKey = process.env.LK_API_KEY;
const apiSecret = process.env.LK_API_SECRET;

export const verifyToken = (token: string) => {
  const verifier = new TokenVerifier(apiKey!, apiSecret!);
  return verifier.verify(token);
};

export const createToken = (userInfo: AccessTokenOptions, grant: VideoGrant) => {
  const at = new AccessToken(apiKey, apiSecret, userInfo);
  at.addGrant(grant);
  return at.toJwt();
};

export { VideoGrant };
