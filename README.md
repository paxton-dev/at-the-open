# At The Open

At The Open gives authenticated users one clear answer: the latest reported
opening price for a US stock. Successful lookups are saved to each user's
private search history.

The application is intentionally small, but it is built as a production-shaped
system: server-side authentication, durable persistence, an isolated market-data
adapter, deterministic browser tests, security headers, CI, and AWS
infrastructure as code.

## What it demonstrates

- Email/password sign-up, sign-in, session handling, and sign-out with Better Auth
- Protected page and API access enforced on the server
- PostgreSQL persistence through Drizzle ORM and versioned SQL migrations
- Server-only Finnhub integration with input validation and typed error handling
- Responsive, accessible UI with loading, empty, success, and failure states
- Unit and Playwright tests, including the complete reviewer happy path
- Repeatable AWS deployment with SST, Lambda, S3, and CloudFront

## Architecture

| Concern | Choice |
| --- | --- |
| Application | Next.js 16 + React 19 + TypeScript |
| Authentication | Better Auth with database-backed sessions |
| Database | PostgreSQL (Neon in production) + Drizzle ORM |
| Market data | Finnhub quote API, called only from the server |
| Hosting | AWS via SST: CloudFront, S3, and Lambda |
| Production URL | `https://open.jamespaxton.io` |
| Tests | Vitest for domain code; Playwright for the full user journey |

The custom domain and CloudFront are complementary, not competing deployment
choices. Visitors use `open.jamespaxton.io`; DNS sends that traffic to the
CloudFront distribution managed by SST.

See [docs/architecture.md](docs/architecture.md) for boundaries, request flows,
security decisions, and tradeoffs.

## Run locally

Prerequisites:

- Node.js 22+
- PostgreSQL 15+
- A free [Finnhub](https://finnhub.io/) API key

```bash
npm ci
cp .env.example .env.local
npm run db:migrate
npm run dev
```

Then visit `http://localhost:3000`.

Set `DATABASE_URL`, `BETTER_AUTH_SECRET`, and `FINNHUB_API_KEY` in `.env.local`.
Generate the auth secret with `openssl rand -base64 32`. For predictable local
quotes without Finnhub, set `MARKET_DATA_MODE=test`; AAPL, MSFT, NVDA, and AMZN
are available in that mode.

## Quality checks

```bash
npm run check       # ESLint, TypeScript, and unit tests
npm run build       # Production Next.js build
npm run test:e2e    # Full sign-up → lookup → logout → login journey
```

The browser suite starts an isolated app server on port 3100, forces deterministic
market data, and removes its synthetic user afterward. It requires a migrated test
database. GitHub Actions provisions PostgreSQL and runs the entire suite on every
pull request and push to `main`.

## Deploy to AWS

Production uses Neon for Postgres and SST for AWS infrastructure. Before the
first deploy:

1. Create a Neon database and run `npm run db:migrate` against its connection
   string.
2. Request or import an ACM certificate for `open.jamespaxton.io` in
   `us-east-1`, and validate it through DNS.
3. Configure the three stage-scoped SST secrets:

   ```bash
   npx sst secret set DatabaseUrl "<neon-connection-string>" --stage production
   npx sst secret set AuthSecret "<random-32+-character-secret>" --stage production
   npx sst secret set FinnhubApiKey "<finnhub-key>" --stage production
   ```

4. Deploy with the certificate ARN available only to the infrastructure process:

   ```bash
   SST_CERTIFICATE_ARN="<certificate-arn>" npm run deploy:aws
   ```

5. Point the `open` DNS CNAME at the `distributionUrl` printed by SST. Once DNS
   resolves, exercise sign-up, lookup, sign-out, and sign-in against the live URL.

SST marks production resources as protected and retained. Secrets are linked at
runtime and never embedded in the browser bundle.

## Useful commands

| Command | Purpose |
| --- | --- |
| `npm run db:generate` | Generate a migration after a schema change |
| `npm run db:migrate` | Apply pending migrations |
| `npm run test:watch` | Run unit tests interactively |
| `npm run deploy:aws` | Deploy the production SST stage |

## Scope decisions

Search history is the one small extension beyond the prompt. It makes database
use visible to a reviewer and proves records are scoped to the signed-in user.
Password reset, email verification, social login, and streaming prices are
deliberately left out: they add operational surface without strengthening the
exercise's core signal.

Market data is informational, may be delayed, and is not investment advice.
