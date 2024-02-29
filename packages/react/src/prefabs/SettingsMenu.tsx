'use client';
import * as React from 'react';
import { useMaybeLayoutContext } from '../context';
import { TrackToggle } from '../components';
import { MediaDeviceMenu } from './MediaDeviceMenu';
import { LocalAudioTrack, Track } from 'livekit-client';
import { useLocalParticipant } from '../hooks';
import { log } from '@livekit/components-core';

/**
 * @alpha
 */
export interface SettingsMenuProps extends React.HTMLAttributes<HTMLDivElement> {
  media: false | { label: string; microphone: boolean; camera: boolean; speaker: boolean };
  effects:
    | false
    | { label: string; camera: Record<string, boolean>; microphone: Record<string, boolean> };
}

/**
 * @alpha
 */
export function SettingsMenu({ media, effects, ...props }: SettingsMenuProps) {
  const layoutContext = useMaybeLayoutContext();

  const settings = React.useMemo(() => {
    return {
      media,
      effects,
    };
  }, []);

  const tabs = React.useMemo(
    () => Object.keys(settings) as Array<keyof typeof settings>,
    [settings],
  );
  const { microphoneTrack } = useLocalParticipant();

  const [activeTab, setActiveTab] = React.useState(tabs[0]);
  const [isNoiseFilterEnabled, setIsNoiseFilterEnabled] = React.useState(false);

  React.useEffect(() => {
    const micPublication = microphoneTrack;
    if (micPublication && micPublication.track instanceof LocalAudioTrack) {
      const currentProcessor = micPublication.track.getProcessor();
      if (currentProcessor && !isNoiseFilterEnabled) {
        micPublication.track.stopProcessor();
      } else if (!currentProcessor && isNoiseFilterEnabled) {
        import('@livekit/noise-filter')
          .then(({ NoiseFilter }) => {
            micPublication?.track
              // @ts-ignore
              ?.setProcessor(NoiseFilter({}))
              .then(() => console.log('successfully set noise filter'));
          })
          .catch((e) => log.error('Failed to load noise filter', e));
      }
    }
  }, [isNoiseFilterEnabled, microphoneTrack]);

  return (
    <div className="lk-settings" style={{ width: '100%' }} {...props}>
      <div className="lk-tabs">
        {tabs.map(
          (tab) =>
            settings[tab] && (
              <button
                className="lk-button lk-tab"
                key={tab}
                onClick={() => setActiveTab(tab)}
                aria-pressed={tab === activeTab}
              >
                {
                  // @ts-ignore
                  settings[tab].label
                }
              </button>
            ),
        )}
      </div>
      <div className="lk-tab-content">
        {activeTab === 'media' && (
          <>
            {settings.media && settings.media.camera && (
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
            {settings.media && settings.media.microphone && (
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
            {settings.media && settings.media.speaker && (
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
            <label htmlFor="noise-filter"> Enhanced Noise Cancellation</label>
            <input
              type="checkbox"
              id="noise-filter"
              onChange={(ev) => setIsNoiseFilterEnabled(ev.target.checked)}
              checked={isNoiseFilterEnabled}
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
