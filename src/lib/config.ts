import { Resource } from "sst/resource";

const localDatabaseUrl =
  "postgresql://postgres:postgres@localhost:5432/at_the_open";

type LinkedSecretName = "DatabaseUrl" | "AuthSecret" | "FinnhubApiKey";

export const config = {
  databaseUrl:
    linkedSecret("DatabaseUrl") ??
    process.env.DATABASE_URL ??
    localDatabaseUrl,
  authSecret:
    linkedSecret("AuthSecret") ??
    process.env.BETTER_AUTH_SECRET ??
    "local-development-secret-change-before-production",
  authUrl: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  finnhubApiKey: linkedSecret("FinnhubApiKey") ?? process.env.FINNHUB_API_KEY,
  finnhubBaseUrl: "https://finnhub.io/api/v1",
  marketDataMode: process.env.MARKET_DATA_MODE === "test" ? "test" : "finnhub",
};

export function assertExternalServicesConfigured() {
  if (
    config.databaseUrl === localDatabaseUrl &&
    process.env.NODE_ENV === "production"
  ) {
    throw new Error("DATABASE_URL is not configured");
  }

  if (
    config.authSecret === "local-development-secret-change-before-production" &&
    process.env.NODE_ENV === "production"
  ) {
    throw new Error("BETTER_AUTH_SECRET is not configured");
  }

  if (
    !config.finnhubApiKey &&
    config.marketDataMode === "finnhub" &&
    process.env.NODE_ENV === "production"
  ) {
    throw new Error("FINNHUB_API_KEY is not configured");
  }
}

function linkedSecret(name: LinkedSecretName) {
  try {
    // SST decrypts linked secrets at runtime; direct environment variables remain
    // the fallback for ordinary `next dev` and test runs outside SST.
    const resources = Resource as unknown as Record<
      LinkedSecretName,
      { value?: unknown } | undefined
    >;
    const value = resources[name]?.value;
    return typeof value === "string" ? value : undefined;
  } catch {
    return undefined;
  }
}
