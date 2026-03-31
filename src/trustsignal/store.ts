import type { Devvit } from '@devvit/public-api';

import type { TrustSignalScanRecord } from './types.js';

const SCAN_KEY_PREFIX = 'trustsignal:scan:';

function getScanKey(postId: string): string {
  return `${SCAN_KEY_PREFIX}${postId}`;
}

export async function getStoredScan(
  context: Pick<Devvit.Context, 'kvStore'>,
  postId: string
): Promise<TrustSignalScanRecord | undefined> {
  return await context.kvStore.get<TrustSignalScanRecord>(getScanKey(postId));
}

export async function saveStoredScan(
  context: Pick<Devvit.Context, 'kvStore'>,
  record: TrustSignalScanRecord
): Promise<void> {
  await context.kvStore.put(getScanKey(record.postId), record);
}
