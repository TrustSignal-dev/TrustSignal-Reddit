import { redis } from '@devvit/web/server';

import type {
  ModActionRecord,
  SubredditStats,
  TrustSignalScanRecord,
} from '../../shared/types.js';

const MOD_LOG_MAX = 200;
const SCAN_INDEX_MAX = 200;

const scanKey = (postId: string) => `ts:scan:${postId}`;
const scansIndexKey = (subredditName: string) => `ts:scans:${subredditName}`;
const modLogKey = (subredditName: string) => `ts:modlog:${subredditName}`;
const statsKey = (subredditName: string) => `ts:stats:${subredditName}`;

export async function getStoredScan(postId: string): Promise<TrustSignalScanRecord | undefined> {
  const raw = await redis.get(scanKey(postId));
  if (!raw) return undefined;
  try {
    return JSON.parse(raw) as TrustSignalScanRecord;
  } catch {
    return undefined;
  }
}

export async function saveStoredScan(record: TrustSignalScanRecord): Promise<void> {
  await redis.set(scanKey(record.postId), JSON.stringify(record));
  await redis.zAdd(scansIndexKey(record.subredditName), {
    score: new Date(record.scannedAt).getTime(),
    member: JSON.stringify(record),
  });

  const total = await redis.zCard(scansIndexKey(record.subredditName));
  if (total > SCAN_INDEX_MAX) {
    await redis.zRemRangeByRank(scansIndexKey(record.subredditName), 0, total - SCAN_INDEX_MAX - 1);
  }
}

export async function listRecentScans(
  subredditName: string,
  limit = 12,
): Promise<TrustSignalScanRecord[]> {
  const results = await redis.zRange(scansIndexKey(subredditName), 0, limit - 1, {
    by: 'rank',
    reverse: true,
  });

  const records: TrustSignalScanRecord[] = [];
  for (const entry of results) {
    try {
      records.push(JSON.parse(entry.member) as TrustSignalScanRecord);
    } catch {
      continue;
    }
  }

  return records;
}

export async function appendModAction(action: ModActionRecord): Promise<void> {
  const key = modLogKey(action.subredditName);
  const score = new Date(action.performedAt).getTime();

  await redis.zAdd(key, {
    score,
    member: JSON.stringify(action),
  });

  const total = await redis.zCard(key);
  if (total > MOD_LOG_MAX) {
    await redis.zRemRangeByRank(key, 0, total - MOD_LOG_MAX - 1);
  }
}

export async function getModActionLog(
  subredditName: string,
  limit = 50,
): Promise<ModActionRecord[]> {
  const results = await redis.zRange(modLogKey(subredditName), 0, limit - 1, {
    by: 'rank',
    reverse: true,
  });

  const records: ModActionRecord[] = [];
  for (const entry of results) {
    try {
      records.push(JSON.parse(entry.member) as ModActionRecord);
    } catch {
      continue;
    }
  }

  return records;
}

export async function getSubredditStats(subredditName: string): Promise<SubredditStats> {
  const raw = await redis.hGetAll(statsKey(subredditName));

  if (!raw || Object.keys(raw).length === 0) {
    return { totalScanned: 0, totalFlagged: 0, averageScore: 0, lastScanAt: null };
  }

  const totalScanned = Number.parseInt(raw.totalScanned ?? '0', 10);
  const totalFlagged = Number.parseInt(raw.totalFlagged ?? '0', 10);
  const scoreSum = Number.parseInt(raw.scoreSum ?? '0', 10);

  return {
    totalScanned,
    totalFlagged,
    averageScore: totalScanned > 0 ? Math.round(scoreSum / totalScanned) : 0,
    lastScanAt: raw.lastScanAt ?? null,
  };
}

export async function updateSubredditStats(
  subredditName: string,
  score: number,
  flagged: boolean,
): Promise<void> {
  const key = statsKey(subredditName);

  await redis.hIncrBy(key, 'totalScanned', 1);
  await redis.hIncrBy(key, 'scoreSum', score);

  if (flagged) {
    await redis.hIncrBy(key, 'totalFlagged', 1);
  }

  await redis.hSet(key, { lastScanAt: new Date().toISOString() });
}
