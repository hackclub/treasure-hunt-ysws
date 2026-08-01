# Treasure Hunt

The web app that runs **Treasure Hunt**, a Hack Club YSWS ("You Ship, We Ship") event. Teenagers get 2 months to complete seven *Journeys* - each Journey being a project with at least four hours of work behind it - and earn real prizes for shipping.

---

## What is Treasure-hunt?

Treasure Hunt is a shipping challenge. The rules are simple:

- You have **2 months** to complete **7 Journeys**.
- Each Journey is a project you've spent **at least 4 hours** building.
- Ship past the 4-hour minimum and the extra time turns into **Gold Bars**, which you spend in the shop on prizes.
- Complete a Journey and you unlock its reward on the map (stickers, a USB stick, a domain, a t-shirt, and so on).

Anyone aged 13–18 can take part. Like every Hack Club event, it's free.

### Submission flows

1. A participant creates a project and submits it against one of their Journeys.
2. The submission lands in the reviewer queue as `unreviewed` and is sent off to Hack Club's fraud service ("Joe") for an hours check.
3. A reviewer claims it, looks at the code / demo / screenshots, and approves or rejects.
4. On approval the Journey is marked complete, the reward is granted, Gold Bars are paid out, and the participant gets a Slack DM.

---

## Tech stack

- **[SvelteKit](https://svelte.dev/docs/kit)** with **Svelte 5** (runes mode) and **TypeScript**
- **[Tailwind CSS v4](https://tailwindcss.com/)** for styling
- **[Airtable](https://airtable.com/)** as the database
- **[Hack Club Auth](https://auth.hackclub.com/)** for login (OAuth / OIDC, keyed on Slack ID)
- **[Slack Bolt](https://slack.dev/bolt-js/)** for DMs and reviewer channel alerts
- **[UploadThing](https://uploadthing.com/)** for screenshot/file uploads
- **[Hack Club Forms](https://www.npmjs.com/package/hackclub-forms)** for the submission forms
---

## Getting started

### Prerequisites

- **Node.js 22+**
- **pnpm** (`corepack enable` will set it up)
- An Airtable base, a Hack Club Auth application, a Slack app, and an UploadThing app - the app talks to all of these, so you'll need credentials for each.

### 1. Install

```bash
pnpm install
```

### 2. Configure environment

Create a `.env` file in the project root:

```bash
# Airtable (the database)
AIRTABLE_KEY=            # Airtable Personal Access Token, shared with the base
AIRTABLE_BASE_ID=        # the base id (starts with "app...")

# Hack Club Auth (login)
HCA_CLIENT_ID=
HCA_CLIENT_SECRET=
HCA_REDIRECT_ADDRESS=    # your app's base URL, e.g. http://localhost:5173

# Slack (DMs + reviewer alerts)
SLACK_BOT_TOKEN=
SLACK_SIGNING_SECRET=
SLACK_APP_TOKEN=

# UploadThing (file uploads)
UPLOADTHING_TOKEN=

# Fraud service ("Joe")
FRAUD_API_KEY=
FRAUD_WEBHOOK_SECRET=    # secret embedded in the fraud webhook URL path
```

### 3. Run the dev server

```bash
pnpm dev
```

The app comes up on `http://localhost:5173`.

---

## Building for production

```bash
pnpm build      # outputs a Node server to ./build
pnpm preview    # preview the production build locally
```

Because it uses `adapter-node`, the build is a standalone Node app you start with:

```bash
node build
```

### Docker

There's a `Dockerfile` (multi-stage, Node 22 Alpine, pnpm) and a `docker-compose.yml`:

```bash
docker compose up --build
```

The container listens on **port 3000**. Remember to pass the environment variables through - they're required at runtime, not baked into the image.

---

## Project structure

```text
src/
├── app.html                     # HTML shell
├── hooks.server.ts              # auth: token refresh + route guards for /dashboard, /review, /api
├── routes/
│   ├── +page.svelte             # public landing page (the wood-texture / treasure map one)
│   ├── dashboard/               # participant area: projects, shop, gallery, settings
│   ├── review/                  # reviewer queue UI
│   └── api/                     # all backend endpoints (login, projects, review, shop, fraud webhook…)
└── lib/
    ├── db/
    │   ├── airtableClient.ts    # every read/write to Airtable lives here
    │   └── models.ts            # domain types: User, Project, Submission, Journey, Order, Item…
    ├── server/
    │   ├── slack/slackClient.ts # Slack DMs and reviewer channel alerts
    │   ├── uploadthing.ts       # upload handling
    │   └── *Cache.ts            # in-memory caches for gallery / items / projects
    ├── rewards/complete.ts      # grants Journey rewards + Gold Bars (once per user per Journey)
    ├── commponents/             # app-specific Svelte components
    └── shad/                    # shadcn-svelte UI primitives
```

A few things worth knowing your way around:

- **`hooks.server.ts`** is the front door. It reads the Hack Club Auth cookies, silently refreshes an expired access token using the refresh token, and gates every protected route. `/dashboard` needs a login, `/review` needs the reviewer flag, `/api/admin` and `/api/debug` need admin.
- **`airtableClient.ts`** is the single source of truth for data access. Airtable is the database, so this file is where the schema effectively lives.
- **Caching** - gallery, shop items, and projects are cached in memory to keep Airtable's rate limits happy; caches are cleared when the underlying data changes.

---

## Questions

This is a Hack Club project. If you have questions about the event or the code:

- Slack: [@peleg2210](https://hackclub.slack.com/team/U091DE0M4NB)
- Email: [peleg@peleg2210.me](mailto:peleg@peleg2210.me)

Hack Club is a 501(c)(3) nonprofit.