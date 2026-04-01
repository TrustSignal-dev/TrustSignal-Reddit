# TrustSignal for Reddit

TrustSignal is a native Reddit-focused trust and moderation toolkit. This repository contains the **trustsignal-rd** Devvit app, which provides real-time trust scoring and tamper-evident audit logging for Reddit posts directly within the Reddit ecosystem.

## What is in this repo

```text
src/             Root Devvit app for Reddit moderators
src/trustsignal/ Local TrustSignal scoring, settings, storage, and handlers
trustsignal-reddit-web/  Web dashboard for TrustSignal Reddit analytics
```

## Current product surfaces

### 1. Native Devvit moderator tool

The repo root is a Devvit app called `trustsignal-rd`. It runs fully inside Reddit and does not perform unauthorized outbound HTTP requests, ensuring compliance with Reddit's HTTP Fetch Policy.

- **Local heuristics**: The app scores post content with a local moderation engine (`src/trustsignal/score.ts`) inside the Devvit runtime.
- **Persistent storage**: It stores the latest scan result per post in Devvit's secure storage.
- **Automation**: It can auto-scan on post submit and re-scan on post edit.
- **Moderator UI**: It can apply `✓ TS <score>` or `⚑ TS <score>` post flair and provides manual scan/status menu items.
- **Customization**: It exposes installation settings for threshold, auto-scan, edit re-scan, and flair behavior.

## GitHub quick start

### Prerequisites
- Node.js 20+
- Devvit CLI (`npm install -g @devvit/cli`)

### Installation

1. Clone the repo.
2. Run `npm install`.

### Development

```bash
npm run typecheck
npm test
npm run dev
```

Notes:
- `npm run dev` starts `devvit playtest`.
- The test suite validates the local scoring logic and storage handlers.

## Reddit / moderator workflow

For moderators using the TrustSignal Devvit app:

1. Install the app into a test subreddit with Devvit.
2. Open the app settings in Reddit.
3. Configure the TrustSignal threshold and whether scans should run automatically.
4. Use the `TrustSignal: Scan post` menu item on any post for a manual scan.
5. Use the `TrustSignal: Status` subreddit menu item to confirm the active threshold and automation settings.

Behavior:
- Posts below the configured threshold are marked suspicious for moderator review.
- Flair updates are optional and controlled by installation settings.
- Edited posts can be re-scanned automatically when that setting is enabled.
- Unchanged content is skipped on repeat scans to avoid redundant work.

## Security and compliance

- **No Outbound HTTP**: The Devvit app does not hardcode or call unauthorized outbound hosts.
- **Data Privacy**: All data processing is handled within the secure Devvit environment.
- **Audit Integrity**: TrustSignal scores are moderation signals intended to assist, not replace, human judgment.

## Roadmap and limitations

- The app currently uses local heuristics for scoring.
- Future updates will focus on expanding the local rule set and enhancing the tamper-evident audit trail.
- The app targets the native Reddit environment across desktop and mobile surfaces.
