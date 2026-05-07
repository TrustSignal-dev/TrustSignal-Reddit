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

  it('penalises bot-like author names', () => {
    const withBot = scoreTrustSignalContent({
      title: 'Helpful post',
      body: "I wanted to share some thoughts on moderation with the community today.",
      trustThreshold: 50,
      authorName: 'CoolBot123456',
    });

    const withHuman = scoreTrustSignalContent({
      title: 'Helpful post',
      body: "I wanted to share some thoughts on moderation with the community today.",
      trustThreshold: 50,
      authorName: 'alice_mods',
    });

    expect(withBot.trustScore).toBeLessThan(withHuman.trustScore);
  });

  it('penalises long title with very short body', () => {
    const result = scoreTrustSignalContent({
      title: 'This is a very long title for what ends up being a trivial link post here',
      body: 'Check this out.',
      trustThreshold: 50,
    });

    const noTitlePenalty = scoreTrustSignalContent({
      title: 'Short title',
      body: "I've been thinking about this for a while and wanted to share my experience with the community. It's been a challenging few months but I've learned a lot from other mods.",
      trustThreshold: 50,
    });

    expect(result.trustScore).toBeLessThan(noTitlePenalty.trustScore);
  });

  it('returns a contentFingerprint based on title and body', () => {
    const a = scoreTrustSignalContent({ title: 'Same', body: 'Content', trustThreshold: 50 });
    const b = scoreTrustSignalContent({ title: 'Same', body: 'Content', trustThreshold: 50 });
    const c = scoreTrustSignalContent({ title: 'Different', body: 'Content', trustThreshold: 50 });

    expect(a.contentFingerprint).toBe(b.contentFingerprint);
    expect(a.contentFingerprint).not.toBe(c.contentFingerprint);
  });

  it('handles empty post gracefully', () => {
    const result = scoreTrustSignalContent({ title: '', body: '', trustThreshold: 50 });
    expect(result.flagged).toBe(false);
    expect(result.contentLength).toBe(0);
  });
});
