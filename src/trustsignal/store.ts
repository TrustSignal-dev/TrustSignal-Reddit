import type { Devvit } from '@devvit/public-api';

import type { ModActionRecord, SubredditStats, TrustSignalScanRecord } from './types.js';

// ─── Key helpers ──────────────────────────────────────────────────────────────

/** Latest scan result for a single post (JSON string) */
const scanKey = (postId: string) => `ts:scan:${postId}`;

/**
 * Mod action log stored as a Redis sorted set.
 * Score = Unix timestamp (ms) → newest entries have the highest score.
 * Member = JSON-serialised ModActionRecord (unique per actionId).
 */
const modLogKey = (subredditName: string) => `ts:modlog:${subredditName}`;

/**
 * Subreddit aggregate stats stored as a Redis hash.
 * Fields: totalScanned, totalFlagged, scoreSum, lastScanAt
 */
const statsKey = (subredditName: string) => `ts:stats:${subredditName}`;

const MOD_LOG_MAX = 200;

// ─── Scan record storage ──────────────────────────────────────────────────────

export async function getStoredScan(
  context: Pick<Devvit.Context, 'redis'>,
  postId: string
): Promise<TrustSignalScanRecord | undefined> {
  const raw = await context.redis.get(scanKey(postId));
  if (!raw) return undefined;
  try {
    return JSON.parse(raw) as TrustSignalScanRecord;
  } catch {
    return undefined;
  }
}

export async function saveStoredScan(
  context: Pick<Devvit.Context, 'redis'>,
  record: TrustSignalScanRecord
): Promise<void> {
  await context.redis.set(scanKey(record.postId), JSON.stringify(record));
}

// ─── Mod action log (sorted set, newest-first) ────────────────────────────────

/**
 * Appends a tamper-evident mod action record to the subreddit sorted set.
 * Uses the action timestamp (ms) as the score so zRange with REV returns
 * newest entries first. Trims to MOD_LOG_MAX entries after each write.
 */
export async function appendModAction(
  context: Pick<Devvit.Context, 'redis'>,
  action: ModActionRecord
): Promise<void> {
  const key = modLogKey(action.subredditName);
  const score = new Date(action.performedAt).getTime();

  await context.redis.zAdd(key, {
    score,
    member: JSON.stringify(action),
  });

  // Keep only the MOD_LOG_MAX most recent entries.
  // zRemRangeByRank removes by ascending rank (0 = lowest score = oldest).
  // After trim: ranks 0 … (total-MOD_LOG_MAX-1) are removed.
  const total = await context.redis.zCard(key);
  if (total > MOD_LOG_MAX) {
    await context.redis.zRemRangeByRank(key, 0, total - MOD_LOG_MAX - 1);
  }
}

/**
 * Returns the N most recent mod action records for a subreddit (newest first).
 */
export async function getModActionLog(
  context: Pick<Devvit.Context, 'redis'>,
  subredditName: string,
  limit: number = 50
): Promise<ModActionRecord[]> {
  const key = modLogKey(subredditName);
  const total = await context.redis.zCard(key);
  if (total === 0) return [];

  // zRange with reverse:true and by:'rank' returns highest-score (newest) first
  const results = await context.redis.zRange(key, 0, limit - 1, {
    by: 'rank',
    reverse: true,
  });

  const records: ModActionRecord[] = [];
  for (const entry of results) {
    try {
      records.push(JSON.parse(entry.member) as ModActionRecord);
    } catch {
      // skip malformed entries
    }
  }
  return records;
}

// ─── Subreddit stats (hash) ───────────────────────────────────────────────────

export async function getSubredditStats(
  context: Pick<Devvit.Context, 'redis'>,
  subredditName: string
): Promise<SubredditStats> {
  const key = statsKey(subredditName);
  const raw = await context.redis.hGetAll(key);

  if (!raw || Object.keys(raw).length === 0) {
    return { totalScanned: 0, totalFlagged: 0, averageScore: 0, lastScanAt: null };
  }

  const totalScanned = parseInt(raw['totalScanned'] ?? '0', 10);
  const totalFlagged = parseInt(raw['totalFlagged'] ?? '0', 10);
  const scoreSum = parseInt(raw['scoreSum'] ?? '0', 10);
  const lastScanAt = raw['lastScanAt'] ?? null;

  return {
    totalScanned,
    totalFlagged,
    averageScore: totalScanned > 0 ? Math.round(scoreSum / totalScanned) : 0,
    lastScanAt,
  };
}

/**
 * Updates running aggregate stats using atomic hIncrBy calls.
 * This avoids read-modify-write races when two posts are scanned simultaneously.
 */
export async function updateSubredditStats(
  context: Pick<Devvit.Context, 'redis'>,
  subredditName: string,
  score: number,
  flagged: boolean
): Promise<void> {
  const key = statsKey(subredditName);

  await context.redis.hIncrBy(key, 'totalScanned', 1);
  await context.redis.hIncrBy(key, 'scoreSum', score);

  if (flagged) {
    await context.redis.hIncrBy(key, 'totalFlagged', 1);
  }

  await context.redis.hSet(key, { lastScanAt: new Date().toISOString() });
}
