import type { Devvit } from '@devvit/public-api';

import { getTrustSignalSettings } from './settings.js';
import { scoreTrustSignalContent } from './score.js';
import { getStoredScan, saveStoredScan, updateSubredditStats } from './store.js';
import type {
  PostSnapshot,
  ScanSource,
  TrustSignalScanRecord,
} from './types.js';

const HUMAN_FLAIR_COLOR = '#22c55e';
const FLAGGED_FLAIR_COLOR = '#ef4444';

function normalizePost(post: {
  id: string;
  title?: string;
  body?: string;
  permalink?: string;
  subredditName?: string;
  authorName?: string;
}): PostSnapshot {
  return {
    id: post.id,
    title: post.title ?? '',
    body: post.body ?? '',
    permalink: post.permalink ?? '',
    subredditName: post.subredditName ?? '',
    authorName: post.authorName ?? 'unknown',
  };
}

function getFlairText(record: TrustSignalScanRecord): string {
  return record.flagged
    ? `⚑ TS ${record.trustScore}`
    : `✓ TS ${record.trustScore}`;
}

async function applyFlair(
  context: Pick<Devvit.Context, 'reddit'>,
  record: TrustSignalScanRecord
): Promise<void> {
  await context.reddit.setPostFlair({
    subredditName: record.subredditName,
    postId: record.postId,
    text: getFlairText(record),
    textColor: 'dark',
    backgroundColor: record.flagged ? FLAGGED_FLAIR_COLOR : HUMAN_FLAIR_COLOR,
  });
}

export function formatScanToast(
  record: TrustSignalScanRecord,
  skipped: boolean
): string {
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
  context: Pick<Devvit.Context, 'redis' | 'reddit' | 'settings'>,
  options?: { force?: boolean }
): Promise<{ record: TrustSignalScanRecord; skipped: boolean } | undefined> {
  const settings = await getTrustSignalSettings(context);

  if (scanSource === 'post_submit' && !settings.autoScanEnabled) {
    return undefined;
  }

  if (scanSource === 'post_update' && !settings.rescanOnEdit) {
    return undefined;
  }

  const post = normalizePost(await context.reddit.getPostById(postId));
  const score = scoreTrustSignalContent({
    title: post.title,
    body: post.body,
    trustThreshold: settings.trustThreshold,
  });

  const previousScan = await getStoredScan(context, post.id);
  const skipped =
    options?.force !== true &&
    previousScan?.contentFingerprint === score.contentFingerprint &&
    previousScan.trustThreshold === settings.trustThreshold;

  const record: TrustSignalScanRecord = skipped
    ? previousScan
    : {
        ...score,
        postId: post.id,
        postPermalink: post.permalink,
        subredditName: post.subredditName,
        authorName: post.authorName,
        scanSource,
        scannedAt: new Date().toISOString(),
        trustThreshold: settings.trustThreshold,
      };

  if (!skipped) {
    await saveStoredScan(context, record);

    // Update running subreddit stats for the dashboard
    await updateSubredditStats(
      context,
      post.subredditName,
      score.trustScore,
      score.flagged
    );

    if (settings.applyPostFlair) {
      await applyFlair(context, record);
    }
  }

  return { record, skipped };
}
