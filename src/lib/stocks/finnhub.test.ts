import { describe, expect, it, vi } from "vitest";

import { QuoteProviderError, SymbolNotFoundError } from "./errors";
import {
  createFinnhubProvider,
  createFinnhubSymbolSearchProvider,
} from "./finnhub";

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

describe("Finnhub symbol search provider", () => {
  it("returns a bounded, deduplicated list of US symbol matches", async () => {
    const results = Array.from({ length: 9 }, (_, index) => ({
      description:
        index === 0
          ? "APPLE ISPORTS GROUP INC"
          : index === 1
            ? "APPLE INC"
            : `MATCH ${index} WITH APPLE`,
      displaySymbol:
        index === 0 ? "AAPI" : index === 1 ? "AAPL" : `ZZZ${index}`,
      symbol:
        index === 0 ? "AAPI" : index === 1 ? "AAPL" : `ZZZ${index}`,
      type: "Common Stock",
    }));
    results.splice(2, 0, { ...results[1] });

    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      Response.json({ count: results.length, result: results }),
    );

    const provider = createFinnhubSymbolSearchProvider("test-key", fetcher);
    const symbols = await provider.search("apple");

    expect(symbols).toHaveLength(8);
    expect(symbols[0]).toEqual({
      description: "APPLE INC",
      displaySymbol: "AAPL",
      symbol: "AAPL",
    });

    const requestUrl = String(fetcher.mock.calls[0]?.[0]);
    expect(requestUrl).toContain("q=apple");
    expect(requestUrl).toContain("exchange=US");
    expect(fetcher.mock.calls[0]?.[1]?.headers).toEqual({
      "X-Finnhub-Token": "test-key",
    });
  });

  it("translates malformed search responses into a domain error", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(Response.json({ result: "not-an-array" }));

    await expect(
      createFinnhubSymbolSearchProvider("test-key", fetcher).search("apple"),
    ).rejects.toBeInstanceOf(QuoteProviderError);
  });
});
