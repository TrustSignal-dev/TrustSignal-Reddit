import { Devvit, SettingScope } from '@devvit/public-api';

import type { TrustSignalSettingsValues } from './types.js';

export const DEFAULT_SETTINGS: TrustSignalSettingsValues = {
  autoScanEnabled: true,
  applyPostFlair: true,
  rescanOnEdit: true,
  trustThreshold: 50,
};

const SETTING_NAMES = {
  autoScanEnabled: 'auto-scan-enabled',
  applyPostFlair: 'apply-post-flair',
  rescanOnEdit: 'rescan-on-edit',
  trustThreshold: 'trust-threshold',
} as const;

function normalizeThreshold(value: number | undefined): number {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return DEFAULT_SETTINGS.trustThreshold;
  }

  return Math.max(0, Math.min(100, Math.round(value)));
}

export function registerTrustSignalSettings(): void {
  Devvit.addSettings([
    {
      name: SETTING_NAMES.autoScanEnabled,
      label: 'Automatically scan new posts',
      helpText:
        'When enabled, TrustSignal scans each new post as it is submitted.',
      type: 'boolean',
      defaultValue: DEFAULT_SETTINGS.autoScanEnabled,
      scope: SettingScope.Installation,
    },
    {
      name: SETTING_NAMES.rescanOnEdit,
      label: 'Re-scan edited posts',
      helpText:
        'When enabled, TrustSignal recalculates the score when a post body changes.',
      type: 'boolean',
      defaultValue: DEFAULT_SETTINGS.rescanOnEdit,
      scope: SettingScope.Installation,
    },
    {
      name: SETTING_NAMES.applyPostFlair,
      label: 'Apply TrustSignal flair',
      helpText:
        'When enabled, TrustSignal updates the post flair with the latest score.',
      type: 'boolean',
      defaultValue: DEFAULT_SETTINGS.applyPostFlair,
      scope: SettingScope.Installation,
    },
    {
      name: SETTING_NAMES.trustThreshold,
      label: 'Flag threshold',
      helpText:
        'Scores below this threshold are marked suspicious for moderator review.',
      type: 'number',
      defaultValue: DEFAULT_SETTINGS.trustThreshold,
      scope: SettingScope.Installation,
      onValidate: ({ value }) => {
        if (value === undefined) {
          return 'A threshold from 0 to 100 is required.';
        }

        if (value < 0 || value > 100) {
          return 'Threshold must be between 0 and 100.';
        }
      },
    },
  ]);
}

export async function getTrustSignalSettings(
  context: Pick<Devvit.Context, 'settings'>
): Promise<TrustSignalSettingsValues> {
  const values = await context.settings.getAll<
    Partial<Record<(typeof SETTING_NAMES)[keyof typeof SETTING_NAMES], boolean | number>>
  >();
  const autoScanEnabled = values[SETTING_NAMES.autoScanEnabled];
  const applyPostFlair = values[SETTING_NAMES.applyPostFlair];
  const rescanOnEdit = values[SETTING_NAMES.rescanOnEdit];
  const trustThreshold = values[SETTING_NAMES.trustThreshold];

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
