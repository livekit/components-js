import { handleToken } from '@livekit/components-react';

export default handleToken({
  userAllowList: undefined,
  userBlockList: undefined,
  grant: {
    roomJoin: true,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
    roomCreate: true,
  },
});
