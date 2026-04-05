# TrustSignal for Reddit — Moderator Guide

TrustSignal is a moderation tool that automatically scores posts in your subreddit and flags content that may need a closer look. You do not need to be a developer to use it.

---

## What it does

Every time a new post is submitted to your subreddit, TrustSignal scores it automatically. The score tells you how trustworthy the content appears based on its text, author signals, and other factors. High scores mean the post looks fine. Low scores mean it's worth reviewing before it gets traction.

Scores are stored per post and can be checked at any time. You can also trigger a manual scan on any post from the post's mod menu.

---

## What the scores mean

| Score | Label | What it means |
|---|---|---|
| **70 – 100** | Trusted | Content looks normal. No action needed. |
| **40 – 69** | Review | Something caught the system's attention. Worth a look before acting. |
| **0 – 39** | Flagged | High-risk content. Consider reviewing or removing. |

These are signals to help your judgment — not automatic removals. TrustSignal never removes a post on its own.

---

## How to set it up

1. Install TrustSignal from the Reddit App Directory into your subreddit.
2. Go to **Mod Tools → Apps → TrustSignal**.
3. Enter your **TrustSignal API Key** (get this from your dashboard at trustsignal.dev).
4. Save. Automatic scoring is now active on all new posts.

---

## How to use it day-to-day

**Automatic scanning** — happens on every new post with no action required from you.

**Manual scan** — open any post, click the three-dot mod menu (⋯), and select **TrustSignal: Scan post**. Use this for older posts or to re-check an edited post.

**Check subreddit status** — go to your subreddit's mod menu and select **TrustSignal: Status** to see your current threshold setting and whether auto-scan is on.

**Verify a receipt** — if a score badge shows a "Verify" button, clicking it opens a public verification page at trustsignal.dev. This confirms the score is authentic and hasn't been tampered with.

---

## Settings

| Setting | What it controls |
|---|---|
| **API Key** | Required. Links the app to your TrustSignal account. |
| **Web App URL** | Optional. Only change this if your team is self-hosting TrustSignal. |

---

## Things to know

- TrustSignal does not remove posts automatically. It flags them for your review.
- A flagged score is a signal, not a verdict. False positives are possible — use your judgment.
- Edited posts can be re-scanned manually from the mod menu.
- If no API key is configured, scoring is silently skipped until one is added.

---

## For developers

- `src/main.tsx` — App entry, registers triggers and custom post type
- `src/score-badge.tsx` — Score badge UI component
- `src/api-client.ts` — Typed fetch wrapper for TrustSignal API
- `src/config.ts` — Web app URL configuration

```bash
npm install
npm run typecheck
devvit playtest r/yoursubreddit
devvit upload
devvit publish
```
