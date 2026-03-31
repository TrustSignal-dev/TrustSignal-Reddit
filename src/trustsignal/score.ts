import { createHash } from 'node:crypto';

import type { TrustSignalScore } from './types.js';

const MODEL_VERSION = 'local-heuristics-v1';
const NEUTRAL_SCORE = 60;

const AI_STYLE_PHRASES = [
  'in today\'s fast-paced',
  'delve into',
  'it is important to note',
  'in conclusion',
  'overall,',
  'furthermore',
  'moreover',
  'seamless',
  'unlock the',
  'game changer',
];

const PROMO_PHRASES = [
  'subscribe now',
  'limited time',
  'click the link',
  'don\'t miss out',
];

const FIRST_PERSON_PATTERN = /\b(i|i'm|i’ve|i'd|my|me|we|we're|our|us)\b/i;
const CONTRACTION_PATTERN =
  /\b(?:can't|won't|don't|isn't|aren't|i'm|i've|we're|they're|that's|it's)\b/i;

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function countMatches(text: string, pattern: RegExp): number {
  return [...text.matchAll(pattern)].length;
}

function computeSentenceVariance(text: string): number {
  const sentenceLengths = text
    .split(/[.!?]+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean)
    .map((sentence) => sentence.split(/\s+/).length);

  if (sentenceLengths.length < 3) {
    return 0;
  }

  const average =
    sentenceLengths.reduce((sum, length) => sum + length, 0) / sentenceLengths.length;
  const variance =
    sentenceLengths.reduce(
      (sum, length) => sum + (length - average) * (length - average),
      0
    ) / sentenceLengths.length;

  return variance;
}

function buildFingerprint(title: string, body: string): string {
  return createHash('sha256')
    .update(JSON.stringify({ title, body }))
    .digest('hex');
}

export function scoreTrustSignalContent(input: {
  title: string;
  body: string;
  trustThreshold: number;
}): TrustSignalScore {
  const title = input.title.trim();
  const body = input.body.trim();
  const combined = [title, body].filter(Boolean).join('\n');
  const normalized = combined.toLowerCase();
  const reasons: string[] = [];

  if (!combined) {
    return {
      trustScore: input.trustThreshold,
      flagged: false,
      summary: 'No text was available to scan.',
      reasons: ['The post did not contain enough text for a TrustSignal score.'],
      contentFingerprint: buildFingerprint(title, body),
      modelVersion: MODEL_VERSION,
      contentLength: 0,
    };
  }

  let score = NEUTRAL_SCORE;

  if (combined.length < 80) {
    score -= 8;
    reasons.push('Very short post, so the scan has lower confidence.');
  }

  if (FIRST_PERSON_PATTERN.test(normalized)) {
    score += 8;
    reasons.push('Contains first-person language common in firsthand posts.');
  }

  if (CONTRACTION_PATTERN.test(normalized)) {
    score += 4;
    reasons.push('Uses conversational contractions instead of polished boilerplate.');
  }

  const aiPhraseHits = AI_STYLE_PHRASES.filter((phrase) => normalized.includes(phrase));
  if (aiPhraseHits.length > 0) {
    score -= Math.min(24, aiPhraseHits.length * 8);
    reasons.push(
      `Uses stock AI-style phrasing such as "${aiPhraseHits.slice(0, 2).join('" and "')}".`
    );
  }

  const promoHits = PROMO_PHRASES.filter((phrase) => normalized.includes(phrase));
  if (promoHits.length > 0) {
    score -= Math.min(18, promoHits.length * 6);
    reasons.push('Contains promotional language that often appears in generated copy.');
  }

  const bulletLines = body
    .split('\n')
    .filter((line) => /^\s*[-*]\s+/.test(line)).length;
  if (bulletLines >= 4) {
    score -= 6;
    reasons.push('The body is list-heavy and summary-shaped.');
  }

  const linkCount = countMatches(combined, /https?:\/\/\S+/g);
  if (linkCount >= 3) {
    score -= 5;
    reasons.push('Contains several outbound links, which raises spam risk.');
  }

  const exclamationCount = countMatches(combined, /!/g);
  if (exclamationCount >= 4) {
    score -= 4;
    reasons.push('Heavy punctuation makes the post look more promotional than conversational.');
  }

  const sentenceVariance = computeSentenceVariance(combined);
  if (sentenceVariance > 0 && sentenceVariance < 18) {
    score -= 8;
    reasons.push('Sentence lengths are unusually uniform across the post.');
  }

  if (body.length > 1400) {
    score -= 6;
    reasons.push('Long-form polished copy gets a stricter score in moderator mode.');
  }

  const questionCount = countMatches(combined, /\?/g);
  if (questionCount > 0) {
    score += 3;
    reasons.push('Contains questions, which usually indicates direct human interaction.');
  }

  const trustScore = clampScore(score);
  const flagged = trustScore < input.trustThreshold;

  return {
    trustScore,
    flagged,
    summary: flagged
      ? `Flagged below threshold at TS ${trustScore}.`
      : `Scored TS ${trustScore}.`,
    reasons:
      reasons.length > 0
        ? reasons.slice(0, 3)
        : ['No strong risk markers were found in the post text.'],
    contentFingerprint: buildFingerprint(title, body),
    modelVersion: MODEL_VERSION,
    contentLength: combined.length,
  };
}
