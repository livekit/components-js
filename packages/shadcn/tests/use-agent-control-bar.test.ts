import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { Track } from 'livekit-client';
import { useInputControls, usePublishPermissions } from '@/hooks/agents-ui/use-agent-control-bar';
import * as LiveKitComponents from '@livekit/components-react';

const saveAudioInputEnabledMock = vi.fn();
const saveVideoInputEnabledMock = vi.fn();
const saveAudioInputDeviceIdMock = vi.fn();
const saveVideoInputDeviceIdMock = vi.fn();
const microphoneToggleMock = vi.fn();
const cameraToggleMock = vi.fn();
const screenShareToggleMock = vi.fn();

const toggleState = {
  microphone: { enabled: false, pending: false, toggle: microphoneToggleMock },
  camera: { enabled: false, pending: false, toggle: cameraToggleMock },
  screenShare: { enabled: false, pending: false, toggle: screenShareToggleMock },
};

vi.mock('@livekit/components-react', async () => {
  const actual = await vi.importActual('@livekit/components-react');
  return {
    ...actual,
    useLocalParticipantPermissions: vi.fn(() => ({
      canPublish: true,
      canPublishSources: [],
      canPublishData: true,
    })),
    usePersistentUserChoices: vi.fn(() => ({
      saveAudioInputEnabled: saveAudioInputEnabledMock,
      saveVideoInputEnabled: saveVideoInputEnabledMock,
      saveAudioInputDeviceId: saveAudioInputDeviceIdMock,
      saveVideoInputDeviceId: saveVideoInputDeviceIdMock,
    })),
    useSessionContext: vi.fn(() => ({
      local: { microphoneTrack: { source: Track.Source.Microphone } },
    })),
    useTrackToggle: vi.fn(({ source }) => {
      if (source === Track.Source.Camera) {
        return toggleState.camera;
      }
      if (source === Track.Source.ScreenShare) {
        return toggleState.screenShare;
      }
      return toggleState.microphone;
    }),
  };
});

describe('usePublishPermissions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(LiveKitComponents.useLocalParticipantPermissions).mockReturnValue({
      canPublish: true,
      canPublishSources: [],
      canPublishData: true,
    } as any);
  });

  it('allows all publish sources when no source restriction is present', () => {
    const { result } = renderHook(() => usePublishPermissions());

    expect(result.current).toEqual({
      camera: true,
      microphone: true,
      screenShare: true,
      data: true,
    });
  });

  it('maps restricted publish sources to camera, microphone, and screen share', () => {
    vi.mocked(LiveKitComponents.useLocalParticipantPermissions).mockReturnValue({
      canPublish: true,
      canPublishSources: [2],
      canPublishData: false,
    } as any);

    const { result } = renderHook(() => usePublishPermissions());

    expect(result.current).toEqual({
      camera: false,
      microphone: true,
      screenShare: false,
      data: false,
    });
  });

  it('denies all media sources when canPublish is false', () => {
    vi.mocked(LiveKitComponents.useLocalParticipantPermissions).mockReturnValue({
      canPublish: false,
      canPublishSources: [],
      canPublishData: true,
    } as any);

    const { result } = renderHook(() => usePublishPermissions());

    expect(result.current).toEqual({
      camera: false,
      microphone: false,
      screenShare: false,
      data: true,
    });
  });
});

describe('useInputControls', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    toggleState.microphone = { enabled: false, pending: false, toggle: microphoneToggleMock };
    toggleState.camera = { enabled: false, pending: false, toggle: cameraToggleMock };
    toggleState.screenShare = { enabled: false, pending: false, toggle: screenShareToggleMock };
  });

  it('returns the microphone track from the session context', () => {
    const { result } = renderHook(() => useInputControls());

    expect(result.current.microphoneTrack).toEqual({ source: Track.Source.Microphone });
  });

  it('creates track toggles for microphone, camera, and screen share', () => {
    renderHook(() => useInputControls());

    expect(LiveKitComponents.useTrackToggle).toHaveBeenCalledWith(
      expect.objectContaining({ source: Track.Source.Microphone }),
    );
    expect(LiveKitComponents.useTrackToggle).toHaveBeenCalledWith(
      expect.objectContaining({ source: Track.Source.Camera }),
    );
    expect(LiveKitComponents.useTrackToggle).toHaveBeenCalledWith(
      expect.objectContaining({ source: Track.Source.ScreenShare }),
    );
  });

  it('persists selected audio and video device ids', () => {
    const { result } = renderHook(() => useInputControls());

    act(() => {
      result.current.handleAudioDeviceChange('audio-device');
      result.current.handleVideoDeviceChange('video-device');
    });

    expect(saveAudioInputDeviceIdMock).toHaveBeenCalledWith('audio-device');
    expect(saveVideoInputDeviceIdMock).toHaveBeenCalledWith('video-device');
  });

  it('persists microphone enabled preference after toggling', async () => {
    const { result } = renderHook(() => useInputControls());

    await act(async () => {
      await result.current.microphoneToggle.toggle(true);
    });

    expect(microphoneToggleMock).toHaveBeenCalledWith(true);
    expect(saveAudioInputEnabledMock).toHaveBeenCalledWith(true);
  });

  it('turns off screen share before enabling camera', async () => {
    toggleState.screenShare = { enabled: true, pending: false, toggle: screenShareToggleMock };
    const { result } = renderHook(() => useInputControls());

    await act(async () => {
      await result.current.cameraToggle.toggle(true);
    });

    expect(screenShareToggleMock).toHaveBeenCalledWith(false);
    expect(cameraToggleMock).toHaveBeenCalledWith(true);
    expect(saveVideoInputEnabledMock).toHaveBeenCalledWith(true);
  });

  it('turns off camera before enabling screen share', async () => {
    toggleState.camera = { enabled: true, pending: false, toggle: cameraToggleMock };
    const { result } = renderHook(() => useInputControls());

    await act(async () => {
      await result.current.screenShareToggle.toggle(true);
    });

    expect(cameraToggleMock).toHaveBeenCalledWith(false);
    expect(screenShareToggleMock).toHaveBeenCalledWith(true);
  });

  it('routes device errors with the matching track source', () => {
    const handleDeviceError = vi.fn();
    const { result } = renderHook(() => useInputControls({ onDeviceError: handleDeviceError }));
    const microphoneError = new Error('microphone error');
    const cameraError = new Error('camera error');

    act(() => {
      result.current.handleMicrophoneDeviceSelectError(microphoneError);
      result.current.handleCameraDeviceSelectError(cameraError);
    });

    expect(handleDeviceError).toHaveBeenCalledWith({
      source: Track.Source.Microphone,
      error: microphoneError,
    });
    expect(handleDeviceError).toHaveBeenCalledWith({
      source: Track.Source.Camera,
      error: cameraError,
    });
  });

  it('passes preventSave when saveUserChoices is false', () => {
    renderHook(() => useInputControls({ saveUserChoices: false }));

    expect(LiveKitComponents.usePersistentUserChoices).toHaveBeenCalledWith({
      preventSave: true,
    });
  });
});
