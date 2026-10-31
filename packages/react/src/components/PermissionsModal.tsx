import * as React from 'react';
import { createPortal } from 'react-dom';
import { ChatCloseIcon } from '../assets/icons';
import { GrantPermissions } from '../assets/images';
import { getPrejoinTranslations, type PrejoinLanguage } from '../prefabs/prejoinTranslations';

export interface PermissionsModalProps {
  language?: PrejoinLanguage;
  deniedPermissions: { audio: boolean; video: boolean };
  onClose: () => void;
}

export function PermissionsModal({
  language = 'en',
  deniedPermissions,
  onClose,
}: PermissionsModalProps) {
  const t = getPrejoinTranslations(language);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted) {
    return null;
  }

  const modalContent = (
    <div
      data-lk-theme="default"
      className="lk-permission-modal-overlay"
      onClick={() => {
        onClose();
      }}
    >
      <div className="lk-permission-modal-content" onClick={(e) => e.stopPropagation()}>
        <button
          className="lk-permission-modal-close-button"
          onClick={onClose}
          aria-label={t.ariaClose}
        >
          <ChatCloseIcon width={24} height={24} />
        </button>

        <div className="lk-permission-modal-image-container">
          <GrantPermissions width={200} height={200} />
        </div>

        <div className="lk-permission-modal-content-container">
          <h3 className="lk-permission-modal-title">
            {(deniedPermissions.audio && deniedPermissions.video) ||
            (!deniedPermissions.audio && !deniedPermissions.video)
              ? t.permissionTitleBoth
              : deniedPermissions.audio
                ? t.permissionTitleMic
                : t.permissionTitleCam}
          </h3>
          <p className="lk-permission-modal-description">
            {`${
              (deniedPermissions.audio && deniedPermissions.video) ||
              (!deniedPermissions.audio && !deniedPermissions.video)
                ? t.blockedBoth
                : deniedPermissions.audio
                  ? t.blockedMic
                  : t.blockedCam
            } ${t.toEnableAccess}`}
          </p>
          <ol className="lk-permission-modal-instructions">
            <li>{t.step1}</li>
            <li>
              {(deniedPermissions.audio && deniedPermissions.video) ||
              (!deniedPermissions.audio && !deniedPermissions.video)
                ? t.step2Both
                : deniedPermissions.audio
                  ? t.step2Mic
                  : t.step2Cam}
            </li>
            <li>{t.step3}</li>
          </ol>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

export default PermissionsModal;
