'use client';
import * as React from 'react';
import { useMaybeLayoutContext } from '../context';
import { TrackToggle } from '../components';
import { MediaDeviceMenu } from './MediaDeviceMenu';
import { LocalAudioTrack, Track } from 'livekit-client';
import { useLocalParticipant } from '../hooks';

export interface SettingsMenuProps extends React.HTMLAttributes<HTMLDivElement> {}

export function SettingsMenu(props: SettingsMenuProps) {
  const layoutContext = useMaybeLayoutContext();

  const settings = React.useMemo(() => {
    return {
      media: {
        label: 'Media Devices',
        microphone: true,
        camera: true,
        speaker: true,
      },
      effects: {
        label: 'Effects',
        camera: {
          background: true,
        },
        microphone: {
          enhancedNoiseCancellation: true,
        },
      },
    } as const;
  }, []);

  const tabs = React.useMemo(
    () => Object.keys(settings) as Array<keyof typeof settings>,
    [settings],
  );
  const { microphoneTrack } = useLocalParticipant();

  const [activeTab, setActiveTab] = React.useState(tabs[0]);
  const [isNoiseCancellationEnabled, setIsNoiseCancellationEnabled] = React.useState(true);

  React.useEffect(() => {
    const micPublication = microphoneTrack;
    if (micPublication && micPublication.track instanceof LocalAudioTrack) {
      const currentProcessor = micPublication.track.getProcessor();
      if (currentProcessor && !isNoiseCancellationEnabled) {
        micPublication.track.stopProcessor();
      } else if (!currentProcessor && isNoiseCancellationEnabled) {
        import('@livekit/noise-filter').then(({ NoiseFilter }) => {
          micPublication?.track
            // @ts-ignore
            ?.setProcessor(NoiseFilter({}))
            .then(() => console.log('successfully set noise filter'));
        });
      }
    }
  }, [isNoiseCancellationEnabled, microphoneTrack]);

  return (
    <div className="lk-settings" style={{ width: '100%' }} {...props}>
      <div className="lk-tabs">
        {tabs.map((tab) => (
          <button
            className="lk-button lk-tab"
            key={tab}
            onClick={() => setActiveTab(tab)}
            aria-pressed={tab === activeTab}
          >
            {settings[tab]?.label}
          </button>
        ))}
      </div>
      <div className="lk-tab-content">
        {activeTab === 'media' && (
          <>
            {settings.media.camera && (
              <>
                <h3>Camera</h3>
                <section className="lk-button-group">
                  <TrackToggle source={Track.Source.Camera}>Camera</TrackToggle>
                  <div className="lk-button-group-menu">
                    <MediaDeviceMenu kind="videoinput" />
                  </div>
                </section>
              </>
            )}
            {settings.media.microphone && (
              <>
                <h3>Microphone</h3>
                <section className="lk-button-group">
                  <TrackToggle source={Track.Source.Microphone}>Camera</TrackToggle>
                  <div className="lk-button-group-menu">
                    <MediaDeviceMenu kind="audioinput" />
                  </div>
                </section>
              </>
            )}
            {settings.media.speaker && (
              <>
                <h3>Speaker & Headphones</h3>
                <section>
                  <MediaDeviceMenu kind="audiooutput"></MediaDeviceMenu>
                </section>
              </>
            )}
          </>
        )}
        {activeTab === 'effects' && (
          <>
            <label htmlFor="noise-cancellation"> Enhanced Noise Cancellation</label>
            <input
              type="checkbox"
              id="noise-cancellation"
              onChange={(ev) => setIsNoiseCancellationEnabled(ev.target.checked)}
              checked={isNoiseCancellationEnabled}
            ></input>
          </>
        )}
      </div>
      <button
        className="lk-button lk-settings-close-button"
        onClick={() => layoutContext?.widget.dispatch?.({ msg: 'toggle_settings' })}
      >
        Close
      </button>
    </div>
  );
}
