import { settings } from '@devvit/web/server';

import type { TrustSignalSettingsValues } from '../../shared/types.js';

export const DEFAULT_SETTINGS: TrustSignalSettingsValues = {
  autoScanEnabled: true,
  applyPostFlair: true,
  rescanOnEdit: true,
  trustThreshold: 50,
};

function normalizeThreshold(value: number | undefined): number {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return DEFAULT_SETTINGS.trustThreshold;
  }

  return Math.max(0, Math.min(100, Math.round(value)));
}

export async function getTrustSignalSettings(): Promise<TrustSignalSettingsValues> {
  const values = await Promise.all([
    settings.get('autoScanEnabled'),
    settings.get('applyPostFlair'),
    settings.get('rescanOnEdit'),
    settings.get('trustThreshold'),
  ]);

  const [autoScanEnabled, applyPostFlair, rescanOnEdit, trustThreshold] = values;

  return {
    autoScanEnabled:
      typeof autoScanEnabled === 'boolean'
        ? autoScanEnabled
        : DEFAULT_SETTINGS.autoScanEnabled,
    applyPostFlair:
      typeof applyPostFlair === 'boolean'
        ? applyPostFlair
        : DEFAULT_SETTINGS.applyPostFlair,
    rescanOnEdit:
      typeof rescanOnEdit === 'boolean'
        ? rescanOnEdit
        : DEFAULT_SETTINGS.rescanOnEdit,
    trustThreshold:
      typeof trustThreshold === 'number'
        ? normalizeThreshold(trustThreshold)
        : DEFAULT_SETTINGS.trustThreshold,
  };
}

export function validateThreshold(value: unknown): string | null {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return 'A threshold from 0 to 100 is required.';
  }

  if (value < 0 || value > 100) {
    return 'Threshold must be between 0 and 100.';
  }

  return null;
}
