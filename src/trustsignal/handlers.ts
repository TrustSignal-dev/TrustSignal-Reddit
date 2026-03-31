import type { Devvit } from '@devvit/public-api';

import { getTrustSignalSettings } from './settings.js';
import { formatScanToast, runTrustSignalScan } from './scan.js';
import type { ScanSource } from './types.js';

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Unknown error';
}

export async function handleManualScan(
  postId: string,
  context: Pick<Devvit.Context, 'kvStore' | 'reddit' | 'settings'>
): Promise<string> {
  try {
    const result = await runTrustSignalScan(postId, 'menu', context, {
      force: true,
    });

    if (!result) {
      return 'TrustSignal did not run for this post.';
    }

    return formatScanToast(result.record, result.skipped);
  } catch (error) {
    console.error('[TrustSignal] Manual scan failed:', getErrorMessage(error));
    return 'TrustSignal could not scan this post.';
  }
}

export async function handleAutomaticScan(
  postId: string | undefined,
  scanSource: ScanSource,
  context: Pick<Devvit.Context, 'kvStore' | 'reddit' | 'settings'>
): Promise<void> {
  if (!postId) {
    console.error('[TrustSignal] Trigger skipped because the post id was missing.');
    return;
  }

  try {
    await runTrustSignalScan(postId, scanSource, context);
  } catch (error) {
    console.error(
      `[TrustSignal] ${scanSource} scan failed for ${postId}:`,
      getErrorMessage(error)
    );
  }
}

export async function getStatusToast(
  context: Pick<Devvit.Context, 'settings'>
): Promise<string> {
  const settings = await getTrustSignalSettings(context);
  const autoMode = settings.autoScanEnabled ? 'on' : 'off';
  const editMode = settings.rescanOnEdit ? 'on' : 'off';
  const flairMode = settings.applyPostFlair ? 'on' : 'off';

  return `TrustSignal is active. Threshold ${settings.trustThreshold}. Auto-scan ${autoMode}, edit re-scan ${editMode}, flair ${flairMode}.`;
}
