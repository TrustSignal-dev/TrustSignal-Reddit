# TrustSignal for Reddit

[![CI — Devvit](https://img.shields.io/github/actions/workflow/status/TrustSignal-dev/TrustSignal-Reddit/ci-devvit.yml?label=CI%20Devvit)](https://github.com/TrustSignal-dev/TrustSignal-Reddit/actions/workflows/ci-devvit.yml)
[![CI — Devvit Web](https://img.shields.io/github/actions/workflow/status/TrustSignal-dev/TrustSignal-Reddit/ci-web.yml?label=CI%20Devvit%20Web)](https://github.com/TrustSignal-dev/TrustSignal-Reddit/actions/workflows/ci-web.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

TrustSignal for Reddit is now a single Devvit Web moderator app. The shipped product no longer uses Blocks-era `@devvit/public-api`, `devvit.yaml`, or the standalone Next dashboard.

## What the app does

- Scores Reddit posts with a local TrustSignal heuristic engine
- Runs automatic scans on post submit and post update
- Applies post flair based on the configured subreddit threshold
- Logs moderator approve and remove actions against the latest TrustSignal scan
- Shows a native in-Reddit dashboard with subreddit stats, recent scans, and audit history

## Architecture

- `src/client/` renders the moderator dashboard inside Reddit
- `src/server/` handles menu actions, trigger endpoints, settings validation, Reddit API access, and Redis storage
- `src/shared/` contains the shared dashboard and scan record types
- `devvit.json` is the only source of truth for permissions, menu actions, triggers, and settings

## Development

Prerequisites:

- Node.js `22.12.0+`
- Devvit CLI available via `npx devvit`

Commands:

```bash
npm install
npm run typecheck
npm test
npm run build
npm run dev
```

## Deployment

GitHub Actions deploys on pushes to `main` through `.github/workflows/deploy-devvit.yml`.

Required secret:

- `DEVVIT_TOKEN`

The workflow now:

1. installs dependencies
2. typechecks and tests
3. builds the Devvit Web client/server outputs
4. writes the Devvit token correctly to `~/.devvit/token`
5. uploads the app with `npx devvit upload --no-interactive`

## Moderator settings

Subreddit-scoped settings are defined in `devvit.json`:

- `autoScanEnabled`
- `rescanOnEdit`
- `applyPostFlair`
- `trustThreshold`

Default threshold is `50`.
