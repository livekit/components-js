import * as React from 'react';
import { isTrackReference } from '@livekit/components-core';
import { useVoiceAssistant } from '../../hooks/useVoiceAssistant';
import { useIsEncrypted } from '../../hooks/useIsEncrypted';
import { ParticipantContextIfNeeded, TrackRefContextIfNeeded } from './ParticipantTile';
import { AudioVisualizer } from './AudioVisualizer';
import LockLockedIcon from '../../assets/icons/LockLockedIcon';
import { ConnectionQualityIndicator } from './ConnectionQualityIndicator';
import { VoiceAssistantContext } from '../../context/voice-assistant-context';

/** @alpha */
export interface VoiceAssistantTileProps extends React.HTMLAttributes<HTMLDivElement> {}

/**
 * The `VoiceAssistantTile` component is the base utility wrapper for displaying a visual representation of a VoiceAssistant agent.
 * This component can be used anywhere nested within a <LiveKitRoom />.
 *
 * @example Using the `VoiceAssistantTile`
 * ```tsx
 * <VoiceAssistantTile />
 * ```
 * @alpha
 */
export const VoiceAssistantTile: (
  props: VoiceAssistantTileProps & React.RefAttributes<HTMLDivElement>,
) => React.ReactNode = /* @__PURE__ */ React.forwardRef<HTMLDivElement, VoiceAssistantTileProps>(
  function VoiceAssistantTile({ children, ...htmlProps }: VoiceAssistantTileProps, ref) {
    const voiceAssistant = useVoiceAssistant();
    const isEncrypted = useIsEncrypted(voiceAssistant.agent);
    return (
      <div ref={ref} style={{ position: 'relative' }} {...htmlProps}>
        <TrackRefContextIfNeeded trackRef={voiceAssistant.audioTrack}>
          <ParticipantContextIfNeeded participant={voiceAssistant.agent}>
            {children ? (
              <VoiceAssistantContext.Provider value={voiceAssistant}>
                {children}
              </VoiceAssistantContext.Provider>
            ) : (
              <>
                {isTrackReference(voiceAssistant.audioTrack) && (
                  <AudioVisualizer trackRef={voiceAssistant.audioTrack} />
                )}
                <div className="lk-participant-metadata">
                  <div className="lk-participant-metadata-item">
                    <>{isEncrypted && <LockLockedIcon style={{ marginRight: '0.25rem' }} />}</>
                  </div>
                  <ConnectionQualityIndicator className="lk-participant-metadata-item" />
                </div>
              </>
            )}
          </ParticipantContextIfNeeded>
        </TrackRefContextIfNeeded>
      </div>
    );
  },
);
