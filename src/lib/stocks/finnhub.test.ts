import { describe, expect, it, vi } from "vitest";

import { QuoteProviderError, SymbolNotFoundError } from "./errors";
import { createFinnhubProvider } from "./finnhub";

describe("Finnhub quote provider", () => {
  it("maps a successful quote response", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      Response.json({
        c: 234.08,
        h: 235.1,
        l: 229.3,
        o: 231.42,
        pc: 230.17,
        t: 1_788_380_400,
      }),
    );
    const provider = createFinnhubProvider("test-key", fetcher);

    await expect(provider.getQuote("AAPL")).resolves.toMatchObject({
      symbol: "AAPL",
      openingPrice: 231.42,
      currentPrice: 234.08,
      highPrice: 235.1,
      lowPrice: 229.3,
      previousClose: 230.17,
      currency: "USD",
      provider: "finnhub",
    });
    expect(fetcher).toHaveBeenCalledOnce();
    expect(fetcher.mock.calls[0]?.[1]?.headers).toEqual({
      "X-Finnhub-Token": "test-key",
    });
  });

  it("treats a zero opening price as an unknown symbol", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(
        Response.json({ c: 0, h: 0, l: 0, o: 0, pc: 0, t: 0 }),
      );

    await expect(
      createFinnhubProvider("test-key", fetcher).getQuote("XYZQ"),
    ).rejects.toBeInstanceOf(SymbolNotFoundError);
  });

  it("translates provider throttling into a domain error", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response(null, { status: 429 }));

    await expect(
      createFinnhubProvider("test-key", fetcher).getQuote("AAPL"),
    ).rejects.toMatchObject({
      reason: "rate-limit",
    });
  });

  it("translates a malformed provider response into a domain error", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response("not-json", { status: 200 }));

    await expect(
      createFinnhubProvider("test-key", fetcher).getQuote("AAPL"),
    ).rejects.toBeInstanceOf(QuoteProviderError);
  });
});
