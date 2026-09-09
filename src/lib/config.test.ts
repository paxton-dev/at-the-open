import { afterEach, describe, expect, it, vi } from "vitest";

const linkedResources = vi.hoisted(() => ({
  DatabaseUrl: { value: "postgresql://linked.example/at_the_open" },
  AuthSecret: { value: "linked-auth-secret" },
  FinnhubApiKey: { value: "linked-finnhub-key" },
}));

vi.mock("sst/resource", () => ({ Resource: linkedResources }));

describe("runtime configuration", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("reads secrets linked to the deployed SST application", async () => {
    vi.stubEnv("DATABASE_URL", "postgresql://environment.example/at_the_open");
    vi.stubEnv("BETTER_AUTH_SECRET", "environment-auth-secret");
    vi.stubEnv("FINNHUB_API_KEY", "environment-finnhub-key");

    const { config } = await import("./config");

    expect(config.databaseUrl).toBe(
      "postgresql://linked.example/at_the_open",
    );
    expect(config.authSecret).toBe("linked-auth-secret");
    expect(config.finnhubApiKey).toBe("linked-finnhub-key");
  });
});
