# TrustSignal for Reddit

TrustSignal is a Reddit-focused trust and moderation toolkit. This repository currently contains three distinct surfaces:

- A native Devvit moderator app (`trustsignal-rd`) that scores posts inside Reddit and can automatically apply TrustSignal flair.
- A browser extension that shows per-post TrustSignal badges on Reddit pages.
- A bridge service that signs, verifies, and stores audit receipts for extension-driven scoring flows.

Important:

- The native Devvit moderator app no longer uses the Vercel bridge.
- The `bridge/` service remains in this repo only for the browser extension and receipt workflow.

The repo is in an active transition from an external bridge-heavy model toward a more self-contained Reddit-native moderation workflow.

## What is in this repo

```text
src/             Root Devvit app for Reddit moderators
src/trustsignal/ Local TrustSignal scoring, settings, storage, and handlers
bridge/          Node.js bridge service for receipts, verification, and storage
extension/       Chrome extension that annotates Reddit posts with TrustSignal badges
shared/          Shared TypeScript contracts used by the bridge and extension
store_assets/    Listing and store artwork
```

## Current product surfaces

### 1. Native Devvit moderator tool

The repo root is a Devvit app called `trustsignal-rd`. It runs fully inside Reddit and does not call the Vercel bridge.

- It scores post content with local moderation heuristics inside Devvit.
- It stores the latest scan result per post in Devvit storage.
- It can auto-scan on post submit and re-scan on post edit.
- It can apply `✓ TS <score>` or `⚑ TS <score>` post flair.
- It exposes installation settings for threshold, auto-scan, edit re-scan, and flair behavior.

This design was chosen because the previously requested outbound hosts for the Devvit app were rejected during Reddit domain review. The moderator app therefore no longer depends on the bridge to function.

### 2. Browser extension

The `extension/` directory contains the Reddit-facing Chrome extension.

- It injects TrustSignal badges into Reddit pages.
- It uses the bridge service to request receipts and trust scores.
- It is currently intended for manual local loading rather than store distribution.

### 3. Bridge service

The `bridge/` directory contains the receipt and verification service used by the browser extension path, not by the native Devvit app.

- It accepts Reddit events via `/ingest`.
- It computes trust scores and signed receipts.
- It verifies receipts and can return stored flagged items.
- It supports in-memory development storage and optional Supabase persistence.

## GitHub quick start

### Root Devvit app

```bash
npm install
npm run typecheck
npm test
npm run dev
```

Notes:

- `npm run dev` starts `devvit playtest`.
- The root test suite is intentionally lightweight and currently validates the local scoring logic.
- The Devvit app uses legacy Blocks wiring because that is the safest fit for the installed Devvit dependency set in this repo.

### Bridge service

```bash
cd bridge
npm install
npm run build
npm test
npm run dev
```

## Reddit / moderator workflow

For moderators using the native Devvit app:

1. Install the app into a test subreddit with Devvit.
2. Open the app settings in Reddit.
3. Configure the TrustSignal threshold and whether scans should run automatically.
4. Use the `TrustSignal: Scan post` menu item on any post for a manual scan.
5. Use the `TrustSignal: Status` subreddit menu item to confirm the active threshold and automation settings.

Behavior:

- Posts below the configured threshold are marked suspicious.
- Flair updates are optional and controlled by installation settings.
- Edited posts can be re-scanned automatically when that setting is enabled.
- Unchanged content is skipped on repeat scans to avoid redundant work.

## Extension workflow

For the browser extension:

1. Load the unpacked `extension/` directory in Chrome.
2. Start the bridge service locally or point the extension at a deployed bridge.
3. Visit Reddit and inspect the injected TrustSignal badges.

The extension continues to rely on the bridge service for remote scoring and signed receipts.

## Bridge configuration

Create `bridge/.env` with the values required by the bridge:

```bash
TS_SIGNING_KEY=your-256-bit-secret-key
HUGGINGFACE_API_KEY=hf_your_key
# Optional:
# SUPABASE_URL=https://your-project.supabase.co
# SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Environment variables:

| Variable | Required | Purpose |
|---|---|---|
| `TS_SIGNING_KEY` | Yes | HMAC-SHA256 key used to sign receipts |
| `HUGGINGFACE_API_KEY` | Yes | Remote scoring provider key used by the bridge |
| `SUPABASE_URL` | No | Enables persistent bridge storage |
| `SUPABASE_SERVICE_ROLE_KEY` | No | Supabase service role credential |

## Testing status

The currently maintained verification path for this repo is:

- Root: `npm run typecheck`
- Root: `npm test`
- Bridge: `npm run build`
- Bridge: `npm test`

The Devvit bundle command may still depend on local Devvit CLI/runtime state and should be treated as an environment-sensitive check rather than the primary CI signal.

## API endpoints

The bridge exposes these primary endpoints:

- `GET /health`
- `POST /ingest`
- `POST /verify`
- `GET /receipt/:hash`
- `GET /flagged`

## Security notes

- The root Devvit app no longer hardcodes outbound bridge hosts.
- Secrets belong in environment variables or Devvit settings, never in source.
- The bridge should avoid logging full request bodies if they may contain sensitive content.
- TrustSignal scores are moderation signals, not definitive authorship proof.

## Known constraints

- The native Devvit app currently uses local heuristics, not the remote bridge model.
- The browser extension and bridge remain a separate operational path from the Devvit app.
- False positives remain possible and moderator judgment is still required.
- The extension targets desktop Reddit web surfaces, not the mobile app.

## Questions

For product feedback or moderation workflow discussion, use Reddit.

For code, setup, or integration issues, use GitHub issues and pull requests in this repository.
