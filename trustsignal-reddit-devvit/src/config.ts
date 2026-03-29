/**
 * AUTONOMOUS DECISION: Base URL defaults to trustsignal.dev in production.
 * In dev/playtest, mods can override via app settings.
 */
export const DEFAULT_BASE_URL = "https://trustsignal.dev";

export function getBaseUrl(settings: { webAppUrl?: string }): string {
  return settings.webAppUrl?.replace(/\/+$/, "") || DEFAULT_BASE_URL;
}
