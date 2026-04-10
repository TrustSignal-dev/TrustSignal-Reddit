import { reddit } from '@devvit/web/server';

import type {
  PostSnapshot,
  ScanSource,
  TrustSignalScanRecord,
} from '../../shared/types.js';
import { getTrustSignalSettings } from './settings.js';
import { scoreTrustSignalContent } from './score.js';
import { getStoredScan, saveStoredScan, updateSubredditStats } from './store.js';

const HUMAN_FLAIR_COLOR = '#22c55e';
const FLAGGED_FLAIR_COLOR = '#ef4444';
type RedditPostId = `t3_${string}`;

function toRedditPostId(postId: string): RedditPostId {
  return (postId.startsWith('t3_') ? postId : `t3_${postId}`) as RedditPostId;
}

function normalizePost(post: Record<string, unknown>): PostSnapshot {
  const rawId = String(post.id ?? '');
  return {
    id: rawId.startsWith('t3_') ? rawId : rawId.replace(/^t3_/, ''),
    title: String(post.title ?? ''),
    body: String(post.body ?? post.selftext ?? ''),
    permalink: String(post.permalink ?? post.url ?? ''),
    subredditName: String(post.subredditName ?? post.subreddit ?? ''),
    authorName: String(post.authorName ?? post.author ?? 'unknown'),
  };
}

function getFlairText(record: TrustSignalScanRecord): string {
  return record.flagged ? `⚑ TS ${record.trustScore}` : `✓ TS ${record.trustScore}`;
}

async function applyFlair(record: TrustSignalScanRecord): Promise<void> {
  await reddit.setPostFlair({
    subredditName: record.subredditName,
    postId: toRedditPostId(record.postId),
    text: getFlairText(record),
    textColor: 'dark',
    backgroundColor: record.flagged ? FLAGGED_FLAIR_COLOR : HUMAN_FLAIR_COLOR,
  });
}

export function formatScanToast(record: TrustSignalScanRecord, skipped: boolean): string {
  if (skipped) {
    return `TrustSignal skipped. ${record.summary}`;
  }

  const headline = record.flagged
    ? `Flagged at TS ${record.trustScore}.`
    : `Scored TS ${record.trustScore}.`;
  const detail = record.reasons[0] ?? 'No strong risk markers were found.';
  return `TrustSignal ${headline} ${detail}`;
}

export async function runTrustSignalScan(
  postId: string,
  scanSource: ScanSource,
  options?: { force?: boolean },
): Promise<{ record: TrustSignalScanRecord; skipped: boolean } | undefined> {
  const appSettings = await getTrustSignalSettings();

  if (scanSource === 'post_submit' && !appSettings.autoScanEnabled) {
    return undefined;
  }

  if (scanSource === 'post_update' && !appSettings.rescanOnEdit) {
    return undefined;
  }

  const post = normalizePost(
    (await reddit.getPostById(toRedditPostId(postId))) as unknown as Record<string, unknown>,
  );
  const score = scoreTrustSignalContent({
    title: post.title,
    body: post.body,
    trustThreshold: appSettings.trustThreshold,
  });

  const previousScan = await getStoredScan(post.id);
  const skipped =
    options?.force !== true &&
    previousScan?.contentFingerprint === score.contentFingerprint &&
    previousScan.trustThreshold === appSettings.trustThreshold;

  const record: TrustSignalScanRecord = skipped && previousScan
    ? previousScan
    : {
        ...score,
        postId: post.id,
        postPermalink: post.permalink,
        subredditName: post.subredditName,
        authorName: post.authorName,
        scanSource,
        scannedAt: new Date().toISOString(),
        trustThreshold: appSettings.trustThreshold,
      };

  if (!skipped) {
    await saveStoredScan(record);
    await updateSubredditStats(post.subredditName, score.trustScore, score.flagged);

    if (appSettings.applyPostFlair) {
      await applyFlair(record);
    }
  }

  return { record, skipped };
}
