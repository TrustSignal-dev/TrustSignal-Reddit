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

export interface TrustSignalScanRecord extends TrustSignalScore {
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

export type ModActionType = 'approve' | 'remove' | 'manual_scan';

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
  performedAt: string;
  note?: string;
}

export interface SubredditStats {
  totalScanned: number;
  totalFlagged: number;
  averageScore: number;
  lastScanAt: string | null;
}

export interface DashboardPayload {
  subredditName: string;
  postId: string | null;
  settings: TrustSignalSettingsValues;
  stats: SubredditStats;
  recentScans: TrustSignalScanRecord[];
  modActions: ModActionRecord[];
}
