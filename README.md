# TrustSignal for Reddit



[![CI — Devvit](https://img.shields.io/github/actions/workflow/status/TrustSignal-dev/TrustSignal-Reddit/ci-devvit.yml?label=CI%20Devvit)](https://github.com/TrustSignal-dev/TrustSignal-Reddit/actions/workflows/ci-devvit.yml)

[![CI — Web](https://img.shields.io/github/actions/workflow/status/TrustSignal-dev/TrustSignal-Reddit/ci-web.yml?label=CI%20Web)](https://github.com/TrustSignal-dev/TrustSignal-Reddit/actions/workflows/ci-web.yml)

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)



Native Reddit trust and moderation toolkit. Real-time trust scoring and tamper-evident audit logging for Reddit posts, built with Reddit's [Devvit](https://developers.reddit.com/docs/) platform.



→ [Web Dashboard](https://trust-signal-reddit.vercel.app)



---



## What's Inside



This repository contains three components:



| Component | Location | Purpose |

|---|---|---|

| **Devvit App** | `src/` | Native Reddit moderator tool (`trustsignal-rd`) |

| **Devvit Packaged App** | `trustsignal-reddit-devvit/` | Packaged Devvit app with API client |

| **Web Dashboard** | `trustsignal-reddit-web/` | Next.js analytics dashboard with Supabase + Stripe |



---



## Devvit App — Moderator Tool



The core Devvit app runs fully inside Reddit with no unauthorized outbound HTTP requests.



### Features



- **Local heuristic scoring** — Scores post content with a local moderation engine (`src/trustsignal/score.ts`)

- **Persistent storage** — Stores latest scan result per post in Devvit secure storage

- **Auto-scan** — Configurable automatic scanning on post submit and post edit

- **Post flair** — Applies `✓ TS <score>` or `⚑ TS <score>` flair based on threshold

- **Manual controls** — Menu items for manual scan and status checks

- **Customizable** — Installation settings for threshold, auto-scan, edit re-scan, and flair behavior



### Moderator Workflow



1. Install the app into a subreddit via Devvit

2. Configure threshold and automation settings in app settings

3. Use `TrustSignal: Scan post` menu item for manual scans

4. Use `TrustSignal: Status` to confirm active settings

5. Posts below threshold are flagged for moderator review



---



## Web Dashboard



A Next.js application providing analytics, audit logs, and credential management.



### Features



- **Post dashboard** — Overview of scanned posts and trust scores

- **Audit log** — Tamper-evident record of all verification events

- **Credentials** — API key management

- **Ingest API** — `POST /api/ingest` for receiving scan data

- **Verify API** — `POST /api/verify` for verification checks

- **Auth** — Supabase authentication with Reddit OAuth callback

- **Billing** — Stripe integration for subscriptions



### Stack



| Layer | Technology |

|---|---|

| Framework | Next.js (App Router) |

| Auth | Supabase |

| Database | Supabase (PostgreSQL) |

| Payments | Stripe |

| Hosting | Vercel |



---



## Quick Start



### Prerequisites



- Node.js 20+

- Devvit CLI (`npm install -g @devvit/cli`)



### Devvit App



```bash

npm install

npm run typecheck

npm test

npm run dev           # Starts devvit playtest

```



### Web Dashboard



```bash

cd trustsignal-reddit-web

npm install

cp .env.example .env.local

# Configure Supabase and Stripe credentials

npm run dev

```



---



## Repository Structure



```

src/                          Devvit app root

├── main.tsx                  App entry point

├── __tests__/                Scoring logic tests

└── trustsignal/

    ├── score.ts              Local heuristic scoring engine

    ├── handlers.ts           Event handlers (submit, edit)

    ├── scan.ts               Scan orchestration

    ├── settings.ts           Installation settings

    ├── store.ts              Devvit secure storage

    └── types.ts              Type definitions

trustsignal-reddit-devvit/    Packaged Devvit app

└── src/

    ├── main.tsx              Packaged app entry

    ├── api-client.ts         TrustSignal API client

    └── config.ts             Configuration

trustsignal-reddit-web/       Web dashboard

└── src/app/

    ├── api/                  API routes (ingest, verify, dashboard, webhooks)

    ├── auth/                 Auth routes

    └── dashboard/            Dashboard pages (posts, audit, credentials)

```



---



## Security & Compliance



- **No unauthorized outbound HTTP** — Devvit app complies with Reddit's HTTP Fetch Policy

- **Data privacy** — All processing within the secure Devvit environment

- **Audit integrity** — Trust scores are moderation signals that assist, not replace, human judgment

- **Unchanged content skipped** — Repeat scans on unchanged posts are avoided



---



## Related Repositories



| Repository | Purpose |

|---|---|

| [TrustSignal](https://github.com/TrustSignal-dev/TrustSignal) | Core API and verification engine |

| [v0-signal-new](https://github.com/TrustSignal-dev/v0-signal-new) | Public website — trustsignal.dev |

