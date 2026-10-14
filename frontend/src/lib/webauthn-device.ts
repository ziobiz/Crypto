/** Per-browser marker: this device already registered a WebAuthn credential for the user. */

export function webauthnDeviceCredKey(userId: string): string {
  return `tinpass_webauthn_device_cred:${userId}`;
}

export function currentWebauthnDeviceLabel(): string {
  if (typeof navigator === 'undefined') return '';
  return navigator.userAgent.slice(0, 60);
}

export function getStoredDeviceCredentialId(userId: string): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(webauthnDeviceCredKey(userId));
}

export function setStoredDeviceCredentialId(userId: string, credentialDbId: string): void {
  localStorage.setItem(webauthnDeviceCredKey(userId), credentialDbId);
}

export function clearStoredDeviceCredentialId(userId: string): void {
  localStorage.removeItem(webauthnDeviceCredKey(userId));
}

export function findThisDeviceCredential<T extends { id: string; deviceLabel: string | null }>(
  userId: string,
  credentials: T[],
): T | null {
  const stored = getStoredDeviceCredentialId(userId);
  if (stored) {
    const byId = credentials.find((c) => c.id === stored);
    if (byId) return byId;
    clearStoredDeviceCredentialId(userId);
  }
  const label = currentWebauthnDeviceLabel();
  if (label) {
    const byLabel = credentials.find((c) => c.deviceLabel === label);
    if (byLabel) {
      setStoredDeviceCredentialId(userId, byLabel.id);
      return byLabel;
    }
  }
  return null;
}
