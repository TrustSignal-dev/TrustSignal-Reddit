import assert from 'node:assert/strict';
import test from 'node:test';

import { scoreTrustSignalContent } from '../trustsignal/score.js';

test('scoreTrustSignalContent keeps firsthand posts above the threshold', () => {
  const result = scoreTrustSignalContent({
    title: 'I finally fixed the issue in our basement',
    body: 'I spent all weekend tracing the leak, and I think I found the bad valve. Do you all see anything I missed?',
    trustThreshold: 50,
  });

  assert.equal(result.flagged, false);
  assert.ok(result.trustScore >= 50);
});

test('scoreTrustSignalContent flags polished boilerplate', () => {
  const result = scoreTrustSignalContent({
    title: 'Unlock the future of productivity',
    body: "In today's fast-paced world, it is important to note that seamless collaboration is a game changer. Furthermore, this limited time workflow helps you unlock the full potential of your team.",
    trustThreshold: 50,
  });

  assert.equal(result.flagged, true);
  assert.ok(result.trustScore < 50);
});
