# TrustSignal Reddit

Cryptographic document verification platform for Reddit communities. Two products:

## Products

### trustsignal-reddit-web
Next.js SaaS app — AI content scoring, verified credentials, tamper-evident mod logs.
See `trustsignal-reddit-web/README.md`.

### trustsignal-reddit-devvit
Devvit app — lightweight bridge that sends Reddit events to the web app API.
See `trustsignal-reddit-devvit/README.md`.

## Quick Start

```bash
# Web app
cd trustsignal-reddit-web
npm install
cp .env.example .env.local
# Fill in env vars
npm run dev

# Devvit app
cd trustsignal-reddit-devvit
npm install
devvit playtest r/yoursubreddit
```
