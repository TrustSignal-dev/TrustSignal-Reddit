import express from 'express';
import type { Request, Response } from 'express';
import {
  context,
  createServer,
  getServerPort,
  reddit,
} from '@devvit/web/server';

import type {
  DashboardPayload,
  ModActionRecord,
  ModActionType,
} from '../shared/types.js';
import { getTrustSignalSettings, validateThreshold } from './trustsignal/settings.js';
import {
  appendModAction,
  getModActionLog,
  getStoredScan,
  getSubredditStats,
  listRecentScans,
} from './trustsignal/store.js';
import { formatScanToast, runTrustSignalScan } from './trustsignal/scan.js';

type UiResponse = {
  showToast?: {
    text: string;
    appearance?: UiAppearance;
  };
};

type UiAppearance = 'neutral' | 'success' | 'error';

type MenuRequest = {
  targetId?: string;
  subredditName?: string;
};

type TriggerRequest = {
  post?: {
    id?: string;
  };
};

function toast(text: string, appearance: UiAppearance = 'neutral') {
  return { showToast: { text, appearance } };
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return 'Unknown error';
}

async function resolveSubredditName(fallback?: string): Promise<string> {
  if (fallback) return fallback;
  if (context.subredditName) return context.subredditName;
  const subreddit = await reddit.getCurrentSubreddit();
  return subreddit?.name ?? '';
}

async function resolveCurrentUsername(): Promise<string> {
  const user = await reddit.getCurrentUser();
  return user?.username ?? user?.displayName ?? 'moderator';
}

async function buildDashboardPayload(): Promise<DashboardPayload> {
  const subredditName = await resolveSubredditName();
  const [appSettings, stats, recentScans, modActions] = await Promise.all([
    getTrustSignalSettings(),
    getSubredditStats(subredditName),
    listRecentScans(subredditName, 12),
    getModActionLog(subredditName, 20),
  ]);

  return {
    subredditName,
    postId: context.postId ?? null,
    settings: appSettings,
    stats,
    recentScans,
    modActions,
  };
}

async function logModAction(postId: string, actionType: ModActionType): Promise<string> {
  const [scanRecord, modName, subredditName] = await Promise.all([
    getStoredScan(postId),
    resolveCurrentUsername(),
    resolveSubredditName(),
  ]);

  if (!scanRecord) {
    return 'TrustSignal: No scan found for this post. Run "Scan post" first.';
  }

  const action: ModActionRecord = {
    actionId: `${postId}:${actionType}:${Date.now()}`,
    postId,
    postPermalink: scanRecord.postPermalink,
    subredditName,
    modName,
    actionType,
    contentFingerprint: scanRecord.contentFingerprint,
    trustScore: scanRecord.trustScore,
    flagged: scanRecord.flagged,
    performedAt: new Date().toISOString(),
  };

  await appendModAction(action);
  const icon = actionType === 'approve' ? '✓' : '⚑';
  return `${icon} TrustSignal logged: ${actionType} on post (TS ${scanRecord.trustScore})`;
}

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.text());

const router = express.Router();

router.get('/api/init', async (_req: Request, res: Response<DashboardPayload>) => {
  res.json(await buildDashboardPayload());
});

router.post('/api/post/:postId/scan', async (req: Request<{ postId: string }>, res) => {
  const result = await runTrustSignalScan(req.params.postId, 'menu', { force: true });
  if (!result) {
    return res.status(404).json({ error: 'scan_unavailable' });
  }

  return res.json({
    record: result.record,
    skipped: result.skipped,
    message: formatScanToast(result.record, result.skipped),
  });
});

router.post(
  '/api/post/:postId/mod-action',
  async (req: Request<{ postId: string }, unknown, { actionType?: ModActionType }>, res) => {
    const actionType = req.body?.actionType;
    if (actionType !== 'approve' && actionType !== 'remove') {
      return res.status(400).json({ error: 'invalid_action_type' });
    }

    const message = await logModAction(req.params.postId, actionType);
    return res.json({ message });
  },
);

router.get('/api/settings', async (_req, res) => {
  res.json(await getTrustSignalSettings());
});

router.post('/internal/settings/validate-threshold', async (req, res) => {
  const message = validateThreshold(req.body?.value);
  res.json({ valid: message === null, message: message ?? undefined });
});

router.post('/internal/menu/scan-post', async (req: Request<never, UiResponse, MenuRequest>, res) => {
  try {
    const postId = req.body?.targetId;
    if (!postId) {
      return res.status(400).json(toast('Missing post id.', 'error'));
    }

    const result = await runTrustSignalScan(postId, 'menu', { force: true });
    if (!result) {
      return res.status(404).json(toast('TrustSignal did not run for this post.', 'error'));
    }

    await appendModAction({
      actionId: `${postId}:manual_scan:${Date.now()}`,
      postId,
      postPermalink: result.record.postPermalink,
      subredditName: result.record.subredditName,
      modName: await resolveCurrentUsername(),
      actionType: 'manual_scan',
      contentFingerprint: result.record.contentFingerprint,
      trustScore: result.record.trustScore,
      flagged: result.record.flagged,
      performedAt: new Date().toISOString(),
    });

    return res.json(toast(formatScanToast(result.record, result.skipped), 'success'));
  } catch (error) {
    console.error('[TrustSignal] Manual scan failed:', getErrorMessage(error));
    return res.status(500).json(toast('TrustSignal could not scan this post.', 'error'));
  }
});

router.post('/internal/menu/log-approve', async (req: Request<never, UiResponse, MenuRequest>, res) => {
  try {
    const postId = req.body?.targetId;
    if (!postId) {
      return res.status(400).json(toast('Missing post id.', 'error'));
    }

    return res.json(toast(await logModAction(postId, 'approve'), 'success'));
  } catch (error) {
    console.error('[TrustSignal] Approve log failed:', getErrorMessage(error));
    return res.status(500).json(toast('TrustSignal could not log this action.', 'error'));
  }
});

router.post('/internal/menu/log-remove', async (req: Request<never, UiResponse, MenuRequest>, res) => {
  try {
    const postId = req.body?.targetId;
    if (!postId) {
      return res.status(400).json(toast('Missing post id.', 'error'));
    }

    return res.json(toast(await logModAction(postId, 'remove'), 'success'));
  } catch (error) {
    console.error('[TrustSignal] Remove log failed:', getErrorMessage(error));
    return res.status(500).json(toast('TrustSignal could not log this action.', 'error'));
  }
});

router.post('/internal/menu/status', async (_req, res) => {
  try {
    const subredditName = await resolveSubredditName();
    const [appSettings, stats] = await Promise.all([
      getTrustSignalSettings(),
      getSubredditStats(subredditName),
    ]);

    const autoMode = appSettings.autoScanEnabled ? 'on' : 'off';
    const editMode = appSettings.rescanOnEdit ? 'on' : 'off';
    const flairMode = appSettings.applyPostFlair ? 'on' : 'off';

    const text = stats.totalScanned > 0
      ? `TrustSignal active. Threshold ${appSettings.trustThreshold}. Auto-scan ${autoMode}, re-scan ${editMode}, flair ${flairMode}. Scanned ${stats.totalScanned} | Flagged ${stats.totalFlagged} | Avg ${stats.averageScore}.`
      : `TrustSignal active. Threshold ${appSettings.trustThreshold}. Auto-scan ${autoMode}, re-scan ${editMode}, flair ${flairMode}.`;

    res.json(toast(text, 'success'));
  } catch (error) {
    console.error('[TrustSignal] Status failed:', getErrorMessage(error));
    res.status(500).json(toast('TrustSignal is active, but the status summary failed.', 'error'));
  }
});

router.post('/internal/menu/dashboard', async (req: Request<never, UiResponse, MenuRequest>, res) => {
  try {
    const subredditName = await resolveSubredditName(req.body?.subredditName);
    if (!subredditName) {
      return res.status(400).json(toast('Could not determine subreddit name.', 'error'));
    }

    await reddit.submitCustomPost({
      subredditName,
      title: `TrustSignal Dashboard · r/${subredditName}`,
      entry: 'default',
      postData: {
        view: 'dashboard',
        subredditName,
      },
    });

    return res.json(toast(`TrustSignal dashboard post created for r/${subredditName}.`, 'success'));
  } catch (error) {
    console.error('[TrustSignal] Dashboard creation failed:', getErrorMessage(error));
    return res.status(500).json(toast('TrustSignal could not create the dashboard post.', 'error'));
  }
});

router.post(
  '/internal/triggers/post-submit',
  async (req: Request<never, { ok: boolean }, TriggerRequest>, res: Response<{ ok: boolean }>) => {
  try {
    const postId = req.body?.post?.id;
    if (postId) {
      await runTrustSignalScan(postId, 'post_submit');
    }
    res.json({ ok: true });
  } catch (error) {
    console.error('[TrustSignal] post_submit failed:', getErrorMessage(error));
    res.status(500).json({ ok: false });
  }
  },
);

router.post(
  '/internal/triggers/post-update',
  async (req: Request<never, { ok: boolean }, TriggerRequest>, res: Response<{ ok: boolean }>) => {
  try {
    const postId = req.body?.post?.id;
    if (postId) {
      await runTrustSignalScan(postId, 'post_update');
    }
    res.json({ ok: true });
  } catch (error) {
    console.error('[TrustSignal] post_update failed:', getErrorMessage(error));
    res.status(500).json({ ok: false });
  }
  },
);

app.use(router);

const port = getServerPort();
const server = createServer(app);

server.on('error', (error) => {
  console.error(`TrustSignal server error: ${error.stack}`);
});

server.listen(port, () => {
  console.log(`TrustSignal Devvit Web server listening on ${port}`);
});
