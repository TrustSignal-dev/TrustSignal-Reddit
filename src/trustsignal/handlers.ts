import type { Devvit } from '@devvit/public-api';

import { getTrustSignalSettings } from './settings.js';
import { formatScanToast, runTrustSignalScan } from './scan.js';
import {
  appendModAction,
  getModActionLog,
  getStoredScan,
  getSubredditStats,
} from './store.js';
import type { ModActionRecord, ModActionType, ScanSource } from './types.js';

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return 'Unknown error';
}

// ─── Manual scan ──────────────────────────────────────────────────────────────

export async function handleManualScan(
  postId: string,
  context: Pick<Devvit.Context, 'redis' | 'reddit' | 'settings'>
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

// ─── Automatic scan (triggers) ────────────────────────────────────────────────

export async function handleAutomaticScan(
  postId: string | undefined,
  scanSource: ScanSource,
  context: Pick<Devvit.Context, 'redis' | 'reddit' | 'settings'>
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

// ─── Status toast ─────────────────────────────────────────────────────────────

export async function getStatusToast(
  context: Pick<Devvit.Context, 'redis' | 'reddit' | 'settings'>
): Promise<string> {
  try {
    const settings = await getTrustSignalSettings(context);
    const subreddit = await context.reddit.getCurrentSubreddit();
    const stats = await getSubredditStats(context, subreddit?.name ?? '');

    const autoMode = settings.autoScanEnabled ? 'on' : 'off';
    const editMode = settings.rescanOnEdit ? 'on' : 'off';
    const flairMode = settings.applyPostFlair ? 'on' : 'off';

    if (stats.totalScanned > 0) {
      const flagRate = Math.round((stats.totalFlagged / stats.totalScanned) * 100);
      return (
        `TrustSignal active. Threshold ${settings.trustThreshold}. ` +
        `Auto-scan ${autoMode}, re-scan ${editMode}, flair ${flairMode}. ` +
        `Scanned ${stats.totalScanned} | Flagged ${flagRate}% | Avg ${stats.averageScore}`
      );
    }

    return `TrustSignal active. Threshold ${settings.trustThreshold}. Auto-scan ${autoMode}, re-scan ${editMode}, flair ${flairMode}.`;
  } catch (error) {
    console.error('[TrustSignal] Status failed:', getErrorMessage(error));
    return 'TrustSignal is active.';
  }
}

// ─── Dashboard toast ──────────────────────────────────────────────────────────

export async function getDashboardToast(
  context: Pick<Devvit.Context, 'redis' | 'reddit' | 'settings'>,
  targetId?: string
): Promise<string> {
  try {
    // targetId is the subreddit thing ID (t5_xxxxx) from the menu event.
    // We resolve the name from it, or fall back to getCurrentSubreddit().
    let name: string | undefined;
    if (targetId) {
      try {
        const sub = await context.reddit.getSubredditById(targetId);
        name = sub?.name;
      } catch {
        // fall through to getCurrentSubreddit
      }
    }
    if (!name) {
      const subreddit = await context.reddit.getCurrentSubreddit();
      name = subreddit?.name;
    }
    if (!name) {
      return 'TrustSignal Dashboard: Could not determine subreddit name.';
    }

    const [stats, modLog] = await Promise.all([
      getSubredditStats(context, name),
      getModActionLog(context, name, 50),
    ]);

    const flagRate =
      stats.totalScanned > 0
        ? Math.round((stats.totalFlagged / stats.totalScanned) * 100)
        : 0;

    if (stats.totalScanned === 0) {
      return `TrustSignal Dashboard | No posts scanned yet in r/${name}. Run "Scan post" on a post first.`;
    }

    return (
      `TrustSignal Dashboard | r/${name} | ` +
      `Scanned: ${stats.totalScanned} | ` +
      `Flagged: ${stats.totalFlagged} (${flagRate}%) | ` +
      `Avg score: ${stats.averageScore} | ` +
      `Mod actions logged: ${modLog.length}`
    );
  } catch (error) {
    console.error('[TrustSignal] Dashboard failed:', getErrorMessage(error));
    return 'TrustSignal dashboard unavailable.';
  }
}

// ─── Mod action logging ───────────────────────────────────────────────────────

/**
 * Records a moderator action against a post, bound to the post's current
 * TrustSignal scan fingerprint. Creates a tamper-evident audit trail:
 * if the post content changes after the action, the fingerprint will no longer
 * match, surfacing a DRIFT signal on the next scan.
 */
export async function logModAction(
  postId: string,
  actionType: ModActionType,
  context: Pick<Devvit.Context, 'redis' | 'reddit' | 'settings'>
): Promise<string> {
  try {
    const [currentUser, subreddit] = await Promise.all([
      context.reddit.getCurrentUser(),
      context.reddit.getCurrentSubreddit(),
    ]);

    if (!currentUser || !subreddit) {
      return 'TrustSignal: Could not log action — missing context.';
    }

    // Fetch the latest scan to bind the content fingerprint
    const scanRecord = await getStoredScan(context, postId);

    if (!scanRecord) {
      return 'TrustSignal: No scan found for this post. Run "Scan post" first.';
    }

    const action: ModActionRecord = {
      actionId: `${postId}:${actionType}:${Date.now()}`,
      postId,
      postPermalink: scanRecord.postPermalink,
      subredditName: subreddit.name,
      modName: currentUser.username,
      actionType,
      contentFingerprint: scanRecord.contentFingerprint,
      trustScore: scanRecord.trustScore,
      flagged: scanRecord.flagged,
      performedAt: new Date().toISOString(),
    };

    await appendModAction(context, action);

    const icon = actionType === 'approve' ? '✓' : '⚑';
    return `${icon} TrustSignal logged: ${actionType} on post (TS ${scanRecord.trustScore})`;
  } catch (error) {
    console.error('[TrustSignal] logModAction failed:', getErrorMessage(error));
    return 'TrustSignal could not log this action.';
  }
}
