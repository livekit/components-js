'use client';

import * as React from 'react';
import { PreJoin, PreJoinValues, setLogLevel } from '@livekit/components-react';
import type { NextPage } from 'next';
import { Track, TrackProcessor } from 'livekit-client';
import { BackgroundBlur } from '@livekit/track-processors';

const PreJoinExample: NextPage = () => {
  setLogLevel('debug', { liveKitClientLogLevel: 'warn' });

  const [backgroundBlur, setBackgroundBlur] = React.useState<
    TrackProcessor<Track.Kind.Video> | undefined
  >(undefined);
  const [errorMessage, setErrorMessage] = React.useState<string>('');
  const [validationError, setValidationError] = React.useState<string>('');

  React.useEffect(() => {
    setBackgroundBlur(BackgroundBlur());
  }, []);

  const handleError = (error: Error) => {
    console.log('error', error);
    setErrorMessage(error.message);
    // Clear validation error when a device error occurs
    setValidationError('');
  };

  const handleValidate = (values: PreJoinValues) => {
    const isValid = Boolean(values.audioAvailable || values.videoAvailable);
    console.log('isValid', isValid, values);

    if (!isValid) {
      setValidationError('At least one device (audio or video) must be available to join.');
      setErrorMessage(''); // Clear device error when validation fails
    } else {
      setValidationError(''); // Clear validation error on success
    }

    return isValid;
  };

  return (
    <div data-lk-theme="default" style={{ height: '100vh' }}>
      {(errorMessage || validationError) && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1000,
            maxWidth: '500px',
            width: '90%',
          }}
        >
          <div
            style={{
              padding: '16px 20px',
              backgroundColor: '#fee',
              border: '2px solid #fcc',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
            }}
          >
            <span style={{ fontSize: '20px', lineHeight: 1 }}>⚠️</span>
            <div style={{ flex: 1 }}>
              <strong style={{ display: 'block', marginBottom: '4px', color: '#c00' }}>
                {validationError ? 'Validation Error' : 'Device Error'}
              </strong>
              <p style={{ margin: 0, color: '#600', fontSize: '14px' }}>
                {validationError || errorMessage}
              </p>
            </div>
            <button
              onClick={() => {
                setErrorMessage('');
                setValidationError('');
              }}
              style={{
                background: 'transparent',
                border: 'none',
                fontSize: '20px',
                cursor: 'pointer',
                padding: '0',
                lineHeight: 1,
                color: '#999',
              }}
            >
              ×
            </button>
          </div>
        </div>
      )}

      <PreJoin
        onError={handleError}
        onValidate={handleValidate}
        videoProcessor={backgroundBlur}
        defaults={{
          videoDeviceId: '',
          videoEnabled: true,
          audioEnabled: true,
        }}
        onSubmit={(values) => {
          values.audioDeviceId;
          // Clear errors on successful submit
          setErrorMessage('');
          setValidationError('');
        }}
      />
    </div>
  );
};

export default PreJoinExample;
