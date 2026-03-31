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
