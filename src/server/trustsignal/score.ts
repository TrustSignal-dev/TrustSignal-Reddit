import { createHash } from 'node:crypto';

import type { TrustSignalScore } from '../../shared/types.js';

const MODEL_VERSION = 'local-heuristics-v2';
const NEUTRAL_SCORE = 60;

const AI_STYLE_PHRASES = [
  "in today's fast-paced",
  'delve into',
  'it is important to note',
  'in conclusion',
  'overall,',
  'furthermore',
  'moreover',
  'seamless',
  'unlock the',
  'game changer',
  'dive deep',
  'at the end of the day',
  'it goes without saying',
  'needless to say',
  'in the realm of',
  'a testament to',
  'revolutionize',
  'cutting-edge',
  'leverage',
  'synergy',
  'paradigm shift',
  'holistic approach',
  'robust solution',
  'best practices',
  'thought leader'
];

const PROMO_PHRASES = [
  'subscribe now',
  'limited time',
  'click the link',
  "don't miss out",
  'act now',
  'buy now',
  'free trial',
  'sign up today',
  'exclusive offer',
  'discount code',
  'use code',
  'affiliate',
  'dm me for',
  'check my profile',
  'link in bio',
  'promo code'
];

const FIRST_PERSON_PATTERN = /\b(i|i'm|i've|i'd|my|me|we|we're|our|us)\b/i;
const CONTRACTION_PATTERN =
  /\b(?:can't|won't|don't|isn't|aren't|i'm|i've|we're|they're|that's|it's|couldn't|wouldn't|shouldn't|didn't|doesn't|hadn't|hasn't|haven't|weren't|wasn't)\b/i;
const ALL_CAPS_WORD_PATTERN = /\b[A-Z]{4,}\b/g;
const REPEATED_PUNCTUATION_PATTERN = /([!?.])\1{2,}/g;
const URL_PATTERN = /https?:\/\/\S+/g;

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
      0,
    ) / sentenceLengths.length;

  return variance;
}

function computeLexicalDiversity(text: string): number {
  const words = text
    .toLowerCase()
    .replace(/[^a-z\s]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 2);
  if (words.length < 10) return 1;
  const unique = new Set(words);
  return unique.size / words.length;
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

  if (FIRST_PERSON_PATTERN.test(normalized)) {
    score += 8;
    reasons.push('Contains first-person language common in firsthand posts.');
  }

  if (CONTRACTION_PATTERN.test(normalized)) {
    score += 6;
    reasons.push('Uses conversational contractions instead of polished boilerplate.');
  }

  const wordCount = combined.split(/\s+/).filter(Boolean).length;
  if (wordCount >= 80) {
    score += 5;
    reasons.push('Substantial post length suggests genuine engagement.');
  }

  const lexicalDiversity = computeLexicalDiversity(combined);
  if (lexicalDiversity >= 0.65) {
    score += 6;
    reasons.push('High lexical diversity suggests original writing.');
  }

  const questionCount = countMatches(combined, /\?/g);
  if (questionCount > 0) {
    score += 3;
    reasons.push('Contains questions, which usually indicates direct human interaction.');
  }

  const aiPhraseHits = AI_STYLE_PHRASES.filter((phrase) => normalized.includes(phrase));
  if (aiPhraseHits.length > 0) {
    score -= Math.min(24, aiPhraseHits.length * 8);
    reasons.push(
      `Uses stock AI-style phrasing such as "${aiPhraseHits.slice(0, 2).join('" and "')}".`,
    );
  }

  const promoHits = PROMO_PHRASES.filter((phrase) => normalized.includes(phrase));
  if (promoHits.length > 0) {
    score -= Math.min(20, promoHits.length * 7);
    reasons.push('Contains promotional language that often appears in generated copy.');
  }

  const bulletLines = body.split('\n').filter((line) => /^\s*[-*•]\s+/.test(line)).length;
  if (bulletLines >= 4) {
    score -= 6;
    reasons.push('The body is list-heavy and summary-shaped.');
  }

  const linkCount = countMatches(combined, URL_PATTERN);
  if (linkCount >= 3) {
    score -= 8;
    reasons.push('Contains several outbound links, which raises spam risk.');
  } else if (linkCount >= 1) {
    score -= 3;
    reasons.push('Contains an outbound link.');
  }

  const exclamationCount = countMatches(combined, /!/g);
  if (exclamationCount >= 5) {
    score -= 6;
    reasons.push('Heavy exclamation use makes the post look promotional.');
  } else if (exclamationCount >= 3) {
    score -= 3;
    reasons.push('Elevated exclamation use.');
  }

  const sentenceVariance = computeSentenceVariance(combined);
  if (sentenceVariance > 0 && sentenceVariance < 18) {
    score -= 8;
    reasons.push('Sentence lengths are unusually uniform across the post.');
  }

  const allCapsCount = countMatches(combined, ALL_CAPS_WORD_PATTERN);
  if (allCapsCount >= 3) {
    score -= 5;
    reasons.push('Multiple all-caps words suggest shouting or spam formatting.');
  }

  const repeatedPunctuationCount = countMatches(combined, REPEATED_PUNCTUATION_PATTERN);
  if (repeatedPunctuationCount >= 2) {
    score -= 4;
    reasons.push('Repeated punctuation (e.g. "!!!" or "...") is common in low-quality posts.');
  }

  if (lexicalDiversity < 0.35 && wordCount >= 20) {
    score -= 8;
    reasons.push('Low lexical diversity suggests repetitive or templated content.');
  }

  const titleWords = title.split(/\s+/).length;
  if (titleWords <= 3 && body.length < 50) {
    score -= 5;
    reasons.push('Very short title and body - minimal content to evaluate.');
  }

  const titleAllCaps = /^[A-Z\s!?]+$/.test(title) && titleWords >= 3;
  if (titleAllCaps) {
    score -= 6;
    reasons.push('Title is written entirely in capitals, a common spam pattern.');
  }

  const trustScore = clampScore(score);
  const flagged = trustScore < input.trustThreshold;

  return {
    trustScore,
    flagged,
    summary: flagged
      ? 'TrustSignal sees strong spam or synthetic-writing markers.'
      : 'TrustSignal sees more human than synthetic signals.',
    reasons: reasons.length
      ? reasons
      : ['No strong risk markers were found in the current heuristic scan.'],
    contentFingerprint: buildFingerprint(title, body),
    modelVersion: MODEL_VERSION,
    contentLength: combined.length,
  };
}
