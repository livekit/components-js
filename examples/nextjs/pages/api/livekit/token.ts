import { handleToken } from '@livekit/components-react';

/**
 * make this more configurable / not too much magic
 */

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
