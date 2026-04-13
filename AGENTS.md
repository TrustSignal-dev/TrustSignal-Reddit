# Repository Guidelines

## Purpose

This repository contains the TrustSignal Reddit moderator product built on Devvit Web. Changes should preserve moderator safety, deterministic scoring behavior, and the current single-app Devvit architecture.

## Guardrails

- Do not reintroduce deprecated Blocks-era patterns such as `@devvit/public-api`, `devvit.yaml`, or a standalone Next dashboard.
- Do not add secrets, tokens, moderator data, or subreddit content to the repo.
- Keep all moderation actions explainable and bounded; avoid opaque or autonomous enforcement logic.
- Do not claim production deployment success unless the Devvit upload path has actually been validated.
- Preserve `devvit.json` as the source of truth for settings, triggers, permissions, and menu actions.

## High-risk areas

- `devvit.json`
- `src/server/`
- `src/shared/`

Changes in those areas affect permissions, trigger behavior, and moderation outcomes.

## Validation

Use the declared repo commands when dependencies are installed:

- `npm run typecheck`
- `npm test`
- `npm run build`

Deployment requires Devvit CLI access and a valid `DEVVIT_TOKEN`.
