# TrustSignal for Reddit

[![CI — Devvit](https://img.shields.io/github/actions/workflow/status/TrustSignal-dev/TrustSignal-Reddit/ci-devvit.yml?label=CI%20Devvit)](https://github.com/TrustSignal-dev/TrustSignal-Reddit/actions/workflows/ci-devvit.yml)
[![CI — Devvit Web](https://img.shields.io/github/actions/workflow/status/TrustSignal-dev/TrustSignal-Reddit/ci-web.yml?label=CI%20Devvit%20Web)](https://github.com/TrustSignal-dev/TrustSignal-Reddit/actions/workflows/ci-web.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

This is a moderator tool for Reddit built with Devvit Web.

If you are new to this repo, think of TrustSignal as a helper that:

- scans posts
- gives each post a TrustSignal score
- can apply flair based on your threshold
- keeps an audit trail of moderator actions
- shows a dashboard inside Reddit

## 30-second summary

- App type: single Devvit Web app (not old Blocks architecture)
- Runtime stack: TypeScript client + server
- Main config file: `devvit.json`
- Latest supported Devvit version for this project: **12.22**

## What this app does (plain English)

1. A post is created or edited.
2. TrustSignal runs a local heuristic scan.
3. The post gets a score.
4. If your subreddit setting allows it, flair is applied automatically.
5. Approve/remove actions are logged against the latest scan for auditing.

## Project layout

- `src/client/`: dashboard UI that moderators see in Reddit
- `src/server/`: triggers, menu actions, settings validation, Reddit API work, storage
- `src/shared/`: shared TypeScript types
- `devvit.json`: source of truth for permissions, triggers, settings, and menu actions

## Prerequisites

- Node.js `22.12.0` or newer
- npm
- Devvit CLI version `12.22`

Check your Devvit CLI version:

```bash
npx devvit --version
```

## Local setup (step-by-step)

1. Install dependencies:

```bash
npm install
```

2. Run quality checks:

```bash
npm run typecheck
npm test
```

3. Build the app:

```bash
npm run build
```

4. Start local development:

```bash
npm run dev
```

## Deployment basics

Deploys are handled by GitHub Actions on pushes to `main` using `.github/workflows/deploy-devvit.yml`.

Required secret:

- `DEVVIT_TOKEN`

`DEVVIT_TOKEN` is maintainer-only for CLI/CI upload workflows. Moderators using TrustSignal inside Reddit do not need this token.

Workflow overview:

1. install dependencies
2. typecheck and test
3. build client/server outputs
4. write token to `~/.devvit/token`
5. upload with `npx devvit upload`

## Subreddit settings you can change

Defined in `devvit.json`:

- `autoScanEnabled`
- `rescanOnEdit`
- `applyPostFlair`
- `trustThreshold` (default: `50`)

## Important notes

- This repo is the Reddit moderator product only.
- It is separate from the main TrustSignal verification API and website repos.
- Do not reintroduce deprecated Blocks-era setup (`@devvit/public-api`, `devvit.yaml`, or a separate Next dashboard).

## Source of truth for ownership

Canonical roles and ownership: [TrustSignal/docs/REPO_ROLES.md](https://github.com/TrustSignal-dev/TrustSignal/blob/master/docs/REPO_ROLES.md)
