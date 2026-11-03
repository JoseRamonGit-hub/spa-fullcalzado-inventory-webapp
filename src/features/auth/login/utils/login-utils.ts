const STORAGE_KEY = "last-login-email";

/** Last email that signed in on this device, so the next shift only types the password. */
export function getLastLoginEmail(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

export function saveLastLoginEmail(email: string) {
  try {
    localStorage.setItem(STORAGE_KEY, email.trim().toLowerCase());
  } catch {
    // Storage blocked (private mode): the form simply starts empty next time.
  }
}

/** Only same-origin paths are accepted, so `?redirect=` can never send users off-site. */
export function getSafeRedirect(redirect: string | undefined): string | undefined {
  if (!redirect || !redirect.startsWith("/") || redirect.startsWith("//")) return undefined;
  return redirect;
}
