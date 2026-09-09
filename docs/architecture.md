# Architecture

## Shape of the system

At The Open is a cohesive Next.js application rather than a separately deployed
single-page app and API. That keeps a short exercise easy to run and review while
still preserving clear boundaries inside the codebase.

The browser talks only to the Next.js application. Server code owns sessions,
database access, and the Finnhub credential. In production, CloudFront is the
public edge, S3 serves static assets, Lambda runs dynamic Next.js routes, and
Neon provides managed PostgreSQL.

## Request flows

### Authentication

1. The browser submits credentials to `/api/auth/*`.
2. Better Auth hashes credentials and persists the user, account, and session in
   PostgreSQL.
3. The browser receives an HTTP-only session cookie.
4. `/dashboard`, `/api/symbols`, and `/api/quotes` independently validate that
   session on the server. An anonymous page request redirects to sign-in; an
   anonymous API request receives `401`.

### Quote lookup

1. The protected dashboard sends a debounced query to `/api/symbols` while the
   user types a ticker or company name.
2. The server searches Finnhub's US listings and returns a bounded,
   relevance-ranked set of symbols without exposing the provider credential.
3. The dashboard enables quote lookup only after the user selects one of those
   verified results, then posts its canonical symbol to `/api/quotes`.
4. The quote endpoint independently normalizes and validates the symbol before
   making an external call, so the UI is not the security boundary.
5. The Finnhub adapter requests the quote with a five-second timeout and keeps
   the API key server-side.
6. A successful opening price is persisted with the authenticated user ID and
   returned to the browser.
7. Provider throttling, missing symbols, invalid input, malformed responses, and
   temporary failures become stable client-facing errors.

## Code boundaries

- `src/app` owns routes, server rendering, metadata, and HTTP translation.
- `src/components` owns interactive and presentational UI.
- `src/lib/stocks` owns symbol rules, the market-data port, Finnhub adapter, and
  quote-search orchestration.
- `src/db` owns the schema, connection, and search-history repository.
- `sst.config.ts` owns deployable AWS infrastructure and runtime secret links.

The quote service depends on provider and repository interfaces. Tests therefore
exercise application behavior without a live database or Finnhub call, while the
Playwright suite verifies the real HTTP, auth, and persistence path against a
temporary PostgreSQL service.

## Data model

Better Auth owns `user`, `session`, `account`, and `verification`. The application
owns `quote_search`:

| Field | Purpose |
| --- | --- |
| `id` | Application-generated record ID |
| `user_id` | Required owner; cascade-deleted with the user |
| `symbol` | Normalized security symbol |
| `opening_price` | Exact `numeric(18,4)` value |
| `currency` | Explicitly USD for the supported market |
| `provider` | Provenance (`finnhub` or deterministic `test`) |
| `provider_timestamp` | Timestamp reported by the provider, when available |
| `searched_at` | Server-side persistence timestamp |

The history query always filters by the authenticated user ID and uses a
composite index for its owner-and-recency access pattern.

## Security and reliability

- Authentication and authorization are server-enforced; hidden UI is not the
  security boundary.
- Sessions are database-backed and cookies are secure in production.
- Password length is bounded and auth endpoints are rate-limited.
- External requests have a timeout, schema validation, and no-store caching.
- Secrets are runtime configuration and are not prefixed with `NEXT_PUBLIC_`.
- CSP, frame, MIME-sniffing, referrer, permissions, and HSTS headers are set at
  the application edge.
- Production infrastructure is protected from accidental removal and database
  resources live outside the deployment lifecycle.
- API errors include request IDs; structured logs retain diagnosis context while
  client responses avoid leaking internals.

## Deliberate tradeoffs

- **Managed Postgres over DynamoDB:** the exercise explicitly values database
  fluency, and relational auth plus user-owned history is easy for reviewers to
  inspect.
- **Better Auth over Cognito:** it keeps the auth implementation in the repository
  and makes database writes visible. Cognito would be reasonable for a larger AWS
  platform but adds hosted-service setup to a short demonstration.
- **SST over handwritten CloudFormation:** the deployment remains infrastructure
  as code while SST handles the substantial Next.js-to-CloudFront integration.
- **No quote cache:** a cache would reduce Finnhub usage but risks surprising a
  reviewer expecting the latest reported session. The adapter boundary makes a
  short-lived cache straightforward to add if traffic justifies it.
- **No automatic production deploy yet:** CI validates every change. Production
  deployment can be enabled after the AWS OIDC role, database, certificate, and
  DNS ownership are confirmed, avoiding long-lived cloud credentials in GitHub.

## Natural next steps

For a real product, the next investments would be email verification and account
recovery, provider-level caching and quotas, OpenTelemetry traces and latency
alarms, a database migration gate in deployment, and an OIDC-based GitHub Actions
release workflow with a protected production environment.
