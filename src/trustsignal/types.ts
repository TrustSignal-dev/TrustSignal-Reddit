export type ScanSource = 'menu' | 'post_submit' | 'post_update';

export interface TrustSignalSettingsValues {
  autoScanEnabled: boolean;
  applyPostFlair: boolean;
  rescanOnEdit: boolean;
  trustThreshold: number;
}

export interface TrustSignalScore {
  trustScore: number;
  flagged: boolean;
  summary: string;
  reasons: string[];
  contentFingerprint: string;
  modelVersion: string;
  contentLength: number;
}

export interface TrustSignalScanRecord
  extends TrustSignalScore,
    Record<string, string | number | boolean | string[]> {
  postId: string;
  postPermalink: string;
  subredditName: string;
  authorName: string;
  scanSource: ScanSource;
  scannedAt: string;
  trustThreshold: number;
}

export interface PostSnapshot {
  id: string;
  title: string;
  body: string;
  permalink: string;
  subredditName: string;
  authorName: string;
}

// ─── Mod Action Log ───────────────────────────────────────────────────────────

export type ModActionType =
  | 'approve'
  | 'remove'
  | 'ban'
  | 'mute'
  | 'lock'
  | 'manual_scan';

/**
 * A tamper-evident record of a moderator action.
 * The contentFingerprint is copied from the most recent TrustSignalScanRecord
 * for the post at the time the action was taken. If the post is later edited,
 * the fingerprint will no longer match, surfacing a DRIFT signal on the next scan.
 */
export interface ModActionRecord {
  actionId: string;
  postId: string;
  postPermalink: string;
  subredditName: string;
  modName: string;
  actionType: ModActionType;
  contentFingerprint: string;
  trustScore: number;
  flagged: boolean;
  performedAt: string; // ISO 8601
  note?: string;
}

// ─── Subreddit Stats ──────────────────────────────────────────────────────────

export interface SubredditStats {
  totalScanned: number;
  totalFlagged: number;
  averageScore: number;
  lastScanAt: string | null;
}
