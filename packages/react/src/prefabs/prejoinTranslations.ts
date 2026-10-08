export type PrejoinLanguage = 'en' | 'de';

export type PrejoinTranslations = {
  join: string;
  microphone: string;
  camera: string;
  username: string;
  ariaClose: string;
  permissionTitleBoth: string;
  permissionTitleMic: string;
  permissionTitleCam: string;
  blockedBoth: string;
  blockedMic: string;
  blockedCam: string;
  toEnableAccess: string;
  step1: string;
  step2Both: string;
  step2Mic: string;
  step2Cam: string;
  step3: string;
  debugUserChoices: string;
  debugUsername: string;
  debugVideoEnabled: string;
  debugAudioEnabled: string;
  debugVideoDevice: string;
  debugAudioDevice: string;
  debugAudioAvailable: string;
  debugVideoAvailable: string;
  debugAudioPermDenied: string;
  debugVideoPermDenied: string;
  debugAudioPermError: string;
  debugVideoPermError: string;
};

export const prejoinTranslations: Record<PrejoinLanguage, PrejoinTranslations> = {
  en: {
    join: 'Join Room',
    microphone: 'Microphone',
    camera: 'Camera',
    username: 'Username',
    ariaClose: 'Close',
    permissionTitleBoth: 'Microphone & Camera Access Required',
    permissionTitleMic: 'Microphone Access Required',
    permissionTitleCam: 'Camera Access Required',
    blockedBoth: 'This application is blocked from using your microphone and camera.',
    blockedMic: 'This application is blocked from using your microphone.',
    blockedCam: 'This application is blocked from using your camera.',
    toEnableAccess: 'To enable access:',
    step1: `Click the settings or info icon next to the website address in your browser. If you don't see it, open your browser settings and look for site permissions.`,
    step2Both:
      'Check microphone and camera access. Make sure access to both devices is enabled in your browser settings.',
    step2Mic:
      'Check microphone access. Make sure access to the mic is enabled in your browser settings.',
    step2Cam:
      'Check camera access. Make sure access to the camera is enabled in your browser settings.',
    step3: 'Refresh the page to apply the changes.',
    debugUserChoices: 'User Choices:',
    debugUsername: 'Username',
    debugVideoEnabled: 'Video Enabled',
    debugAudioEnabled: 'Audio Enabled',
    debugVideoDevice: 'Video Device',
    debugAudioDevice: 'Audio Device',
    debugAudioAvailable: 'Audio Available',
    debugVideoAvailable: 'Video Available',
    debugAudioPermDenied: 'Audio Permission Denied',
    debugVideoPermDenied: 'Video Permission Denied',
    debugAudioPermError: 'Audio Permission Error',
    debugVideoPermError: 'Video Permission Error',
  },
  de: {
    join: 'Raum betreten',
    microphone: 'Mikrofon',
    camera: 'Kamera',
    username: 'Benutzername',
    ariaClose: 'Schließen',
    permissionTitleBoth: 'Zugriff auf Mikrofon & Kamera erforderlich',
    permissionTitleMic: 'Zugriff auf Mikrofon erforderlich',
    permissionTitleCam: 'Zugriff auf Kamera erforderlich',
    blockedBoth:
      'Diese Anwendung ist daran gehindert, dein Mikrofon und deine Kamera zu verwenden.',
    blockedMic: 'Diese Anwendung ist daran gehindert, dein Mikrofon zu verwenden.',
    blockedCam: 'Diese Anwendung ist daran gehindert, deine Kamera zu verwenden.',
    toEnableAccess: 'So aktivierst du den Zugriff:',
    step1: `Klicke auf das Schloss- oder Info-Symbol neben der Website-Adresse in deinem Browser. Falls du es nicht findest, öffne die Einstellungen deines Browsers und suche nach Website-Berechtigungen.`,
    step2Both:
      'Überprüfe den Zugriff auf Mikrofon und Kamera. Stelle sicher, dass der Zugriff auf beide Geräte in den Browsereinstellungen aktiviert ist.',
    step2Mic:
      'Überprüfe den Mikrofonzugriff. Stelle sicher, dass der Zugriff auf das Mikrofon in den Browsereinstellungen aktiviert ist.',
    step2Cam:
      'Überprüfe den Kamerazugriff. Stelle sicher, dass der Zugriff auf die Kamera in den Browsereinstellungen aktiviert ist.',
    step3: 'Lade die Seite neu, um die Änderungen zu übernehmen.',
    debugUserChoices: 'Benutzerauswahl:',
    debugUsername: 'Benutzername',
    debugVideoEnabled: 'Video aktiviert',
    debugAudioEnabled: 'Audio aktiviert',
    debugVideoDevice: 'Videogerät',
    debugAudioDevice: 'Audiogerät',
    debugAudioAvailable: 'Audio verfügbar',
    debugVideoAvailable: 'Video verfügbar',
    debugAudioPermDenied: 'Audio-Zugriff verweigert',
    debugVideoPermDenied: 'Video-Zugriff verweigert',
    debugAudioPermError: 'Fehler beim Audio-Zugriff',
    debugVideoPermError: 'Fehler beim Video-Zugriff',
  },
};

export function getPrejoinTranslations(language: PrejoinLanguage): PrejoinTranslations {
  const defaultLang: PrejoinLanguage = 'en';
  return prejoinTranslations[language] ?? prejoinTranslations[defaultLang];
}
