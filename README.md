# At The Open

At The Open gives authenticated users the latest reported
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
- Server-only Finnhub quote and US-symbol search integration with typed errors
- Verified typeahead selection that prevents arbitrary symbols from being submitted
- Responsive, accessible UI with loading, empty, success, and failure states
- Unit and Playwright tests, including the complete reviewer happy path
- Repeatable AWS deployment with SST, Lambda, S3, and CloudFront

## Architecture

| Concern | Choice |
| --- | --- |
| Application | Next.js 16 + React 19 + TypeScript |
| Authentication | Better Auth with database-backed sessions |
| Database | PostgreSQL (Neon in production) + Drizzle ORM |
| Market data | Finnhub quote API |
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

## Future iterations

### Product capabilities

- **Clear search history:** delete individual recent searches or clear the full
  history with confirmation.
- **Forgot, reset, and change password:** add verified-email password recovery
  and authenticated password changes.
- **Multiple-symbol search and comparison:** search several symbols and compare
  their opening prices and session metrics in one view.
- **Historical trends and visualizations:** chart opening-price changes over time
  and provide an equivalent accessible table view.
- **Email notifications:** let users subscribe to opening-price trend alerts or
  digests, with configurable thresholds, pause, and unsubscribe controls.
- Let users create watchlists and pin frequently researched symbols.
- Add market context such as the opening gap versus previous close, session date,
  exchange, and data-freshness indicators.
- Export a user's search history or comparison results as CSV.

### Platform evolution

- Add email verification, active-session management, account deletion, and data
  export controls.
- Introduce bounded provider caching, per-user quotas, retries, and circuit
  breaking as traffic grows.
- Run alert evaluation as an idempotent scheduled workflow with delivery history,
  retry handling, and duplicate suppression.
- Add structured metrics, traces, provider-latency dashboards, and availability
  alerts around authentication, quote lookup, and notification delivery.
- Expand browser coverage for keyboard-only autocomplete, mobile layouts,
  destructive-action confirmation, and accessible chart alternatives.

## Scope decisions

Search history is the one small extension beyond the prompt. It makes database
use visible to a reviewer and proves records are scoped to the signed-in user.
Password reset, email verification, social login, and streaming prices are
deliberately left out: they add operational surface without strengthening the
exercise's core signal.

## Generative AI disclosure

Generative AI was used as a collaborative tool for:

- Product brainstorming and early page-structure/scaffolding ideas
- Visual design exploration, copy, and CSS iteration
- Drafting and expanding unit tests
- Drafting project documentation

All generated material was reviewed, edited, and validated as part of the final
implementation. The project owner remains responsible for the architecture,
code, security decisions, and deployed application.

Market data is informational, may be delayed, and is not investment advice.
