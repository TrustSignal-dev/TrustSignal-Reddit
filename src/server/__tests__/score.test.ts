import { describe, expect, it } from 'vitest';

import { scoreTrustSignalContent } from '../trustsignal/score.js';

describe('scoreTrustSignalContent', () => {
  it('keeps firsthand posts above the threshold', () => {
    const result = scoreTrustSignalContent({
      title: 'I need advice from other mods',
      body: "I'm dealing with a wave of reposts in our sub and I've tried AutoMod plus manual review. What would you change?",
      trustThreshold: 50,
    });

    expect(result.flagged).toBe(false);
    expect(result.trustScore).toBeGreaterThanOrEqual(50);
  });

  it('flags polished boilerplate', () => {
    const result = scoreTrustSignalContent({
      title: 'Unlock the ultimate moderation workflow',
      body: "In today's fast-paced landscape, it is important to note that this game changer will revolutionize your subreddit. Click the link and subscribe now!!!",
      trustThreshold: 50,
    });

    expect(result.flagged).toBe(true);
    expect(result.trustScore).toBeLessThan(50);
  });
});
