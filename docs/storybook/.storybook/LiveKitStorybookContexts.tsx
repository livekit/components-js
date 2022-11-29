import React, { useEffect, useState } from 'react';
import { LiveKitRoom, Participants } from '@livekit/components-react';
import { DecoratorFn } from '@storybook/react';
import { Room } from 'livekit-client';

export type RoomContextSettings = Partial<{
  audio: boolean;
  video: boolean;
  connect: boolean;
}>;
