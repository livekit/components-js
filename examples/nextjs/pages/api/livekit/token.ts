import { handleToken } from '@livekit/auth-helpers-nextjs';

export default handleToken({
  grant: {
    roomJoin: true,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
    roomCreate: true,
  },
});
