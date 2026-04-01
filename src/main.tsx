import { Devvit } from '@devvit/public-api';

import {
  getDashboardToast,
  getStatusToast,
  handleAutomaticScan,
  handleManualScan,
  logModAction,
} from './trustsignal/handlers.js';
import { registerTrustSignalSettings } from './trustsignal/settings.js';

Devvit.configure({
  redditAPI: true,
  redis: true,
});

registerTrustSignalSettings();

// ─── Post menu items (moderator only) ────────────────────────────────────────

Devvit.addMenuItem({
  location: 'post',
  label: 'TrustSignal: Scan post',
  forUserType: 'moderator',
  onPress: async (event, context) => {
    context.ui.showToast(await handleManualScan(event.targetId, context));
  },
});

Devvit.addMenuItem({
  location: 'post',
  label: 'TrustSignal: Log Approve',
  forUserType: 'moderator',
  onPress: async (event, context) => {
    context.ui.showToast(
      await logModAction(event.targetId, 'approve', context)
    );
  },
});

Devvit.addMenuItem({
  location: 'post',
  label: 'TrustSignal: Log Remove',
  forUserType: 'moderator',
  onPress: async (event, context) => {
    context.ui.showToast(
      await logModAction(event.targetId, 'remove', context)
    );
  },
});

// ─── Subreddit menu items (moderator only) ────────────────────────────────────

Devvit.addMenuItem({
  location: 'subreddit',
  label: 'TrustSignal: Status',
  forUserType: 'moderator',
  onPress: async (_event, context) => {
    context.ui.showToast(await getStatusToast(context));
  },
});

Devvit.addMenuItem({
  location: 'subreddit',
  label: 'TrustSignal: Dashboard',
  forUserType: 'moderator',
  onPress: async (event, context) => {
    // Pass subredditName directly from the event to avoid getCurrentSubreddit() failures
    const subredditName =
      'subredditName' in event ? (event.subredditName as string | undefined) : undefined;
    context.ui.showToast(await getDashboardToast(context, subredditName));
  },
});

Devvit.addTrigger({
  event: 'PostSubmit',
  onEvent: async (event, context) => {
    await handleAutomaticScan(event.post?.id, 'post_submit', context);
  },
});

Devvit.addTrigger({
  event: 'PostUpdate',
  onEvent: async (event, context) => {
    await handleAutomaticScan(event.post?.id, 'post_update', context);
  },
});

export default Devvit;
