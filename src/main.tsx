import { Devvit } from '@devvit/public-api';

import {
  getStatusToast,
  handleAutomaticScan,
  handleManualScan,
} from './trustsignal/handlers.js';
import { registerTrustSignalSettings } from './trustsignal/settings.js';

Devvit.configure({
  redditAPI: true,
  redis: true,
});

registerTrustSignalSettings();

Devvit.addMenuItem({
  location: 'post',
  label: 'TrustSignal: Scan post',
  onPress: async (event, context) => {
    context.ui.showToast(await handleManualScan(event.targetId, context));
  },
});

Devvit.addMenuItem({
  location: 'subreddit',
  label: 'TrustSignal: Status',
  onPress: async (_event, context) => {
    context.ui.showToast(await getStatusToast(context));
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
