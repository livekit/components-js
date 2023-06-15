/**
 * Returns `true` if the browser supports screen sharing.
 */
export function supportsScreenSharing(): boolean {
  return navigator?.mediaDevices && !!navigator.mediaDevices.getDisplayMedia;
}
