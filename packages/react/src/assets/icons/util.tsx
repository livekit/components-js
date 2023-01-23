import * as React from 'react';
import { ConnectionQuality, Track } from 'livekit-client';

import {
  MicIcon,
  MicDisabledIcon,
  CameraIcon,
  CameraDisabledIcon,
  QualityUnknownIcon,
  QualityExcellentIcon,
  QualityGoodIcon,
  QualityPoorIcon,
  ScreenShareIcon,
  ScreenShareStopIcon,
} from './index';

/**
 * @internal
 */
export function getSourceIcon(source: Track.Source, enabled: boolean) {
  switch (source) {
    case Track.Source.Microphone:
      return enabled ? <MicIcon /> : <MicDisabledIcon />;
    case Track.Source.Camera:
      return enabled ? <CameraIcon /> : <CameraDisabledIcon />;
    case Track.Source.ScreenShare:
      return enabled ? <ScreenShareStopIcon /> : <ScreenShareIcon />;
    default:
      return undefined;
  }
}

/**
 * @internal
 */
export function getConnectionQualityIcon(quality: ConnectionQuality) {
  switch (quality) {
    case ConnectionQuality.Excellent:
      return <QualityExcellentIcon />;
    case ConnectionQuality.Good:
      return <QualityGoodIcon />;
    case ConnectionQuality.Poor:
      return <QualityPoorIcon />;
    default:
      return <QualityUnknownIcon />;
  }
}
