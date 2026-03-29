# TrustSignal Reddit Devvit App

A lightweight Devvit app that bridges Reddit into the TrustSignal web platform for AI content scoring and cryptographic verification.

## What it does

1. **On new post**: Calls TrustSignal web app `POST /api/ingest` with the post event
2. **On post view**: Calls `GET /api/score/[postId]` and renders a score badge
3. **Verify button**: Links to `trustsignal.dev/verify?receipt=[id]` for public verification

## Prerequisites

- [Node.js](https://nodejs.org/) v18+
- Devvit CLI: `npm install -g devvit`
- A TrustSignal Pro or Team account with an API key

## Setup

```bash
# Install dependencies
npm install

# Login to Devvit
devvit login

# Link to your test subreddit
devvit playtest r/yoursubreddit
```

## Configuration

After installing the app on a subreddit, configure it in the subreddit's mod tools:

- **API Key**: Your TrustSignal API key from trustsignal.dev/dashboard
- **Web App URL** (optional): Override the default URL if self-hosting

## Development

```bash
# Type check
npm run typecheck

# Build
npm run build

# Playtest on a subreddit
devvit playtest r/yoursubreddit
```

## Publishing

```bash
# Upload to Devvit
devvit upload

# Publish publicly
devvit publish
```

## Architecture

- `src/main.tsx` — App entry, registers triggers and custom post type
- `src/score-badge.tsx` — Score badge UI component
- `src/api-client.ts` — Typed fetch wrapper for TrustSignal API
- `src/config.ts` — Web app URL configuration
