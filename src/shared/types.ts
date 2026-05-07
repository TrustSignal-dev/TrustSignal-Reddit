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
  postTitle: string;
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

export type RemovalReason = 'off_topic' | 'low_quality' | 'spam' | 'rule_violation' | 'appeals' | 'other';
export type ApprovalReason = 'manual_review' | 'false_positive' | 'appeals' | 'other';

export const REMOVAL_TEMPLATES: Record<RemovalReason, string> = {
  off_topic: 'Off-topic for community',
  low_quality: 'Low quality content',
  spam: 'Spam or prohibited content',
  rule_violation: 'Violates community rules',
  appeals: 'Upheld removal appeal',
  other: 'Other reason',
};

export const APPROVAL_TEMPLATES: Record<ApprovalReason, string> = {
  manual_review: 'Manual review approved',
  false_positive: 'False positive flagged scan',
  appeals: 'Approved appeal',
  other: 'Other reason',
};

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
  reason?: RemovalReason | ApprovalReason;
  note?: string;
}

export interface SubredditStats {
  totalScanned: number;
  totalFlagged: number;
  averageScore: number;
  lastScanAt: string | null;
  totalApproved: number;
  totalRemoved: number;
}

export interface DashboardPayload {
  subredditName: string;
  postId: string | null;
  settings: TrustSignalSettingsValues;
  stats: SubredditStats;
  recentScans: TrustSignalScanRecord[];
  modActions: ModActionRecord[];
}
