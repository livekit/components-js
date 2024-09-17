import * as React from 'react';
import type { VoiceAssistant } from '../hooks/useVoiceAssistant';

/** @alpha */
export const VoiceAssistantContext = React.createContext<VoiceAssistant | undefined>(undefined);
