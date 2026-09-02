import { describe, expect, it, vi } from "vitest";

import { searchOpeningPrice } from "./quote-service";
import type {
  QuoteSearchRepository,
  StockQuote,
  StockQuoteProvider,
} from "./types";

const quote: StockQuote = {
  symbol: "AAPL",
  openingPrice: 231.42,
  currentPrice: 234.08,
  highPrice: 235.1,
  lowPrice: 229.3,
  previousClose: 230.17,
  currency: "USD",
  provider: "test",
  providerTimestamp: new Date("2026-09-02T20:00:00.000Z"),
};

describe("searchOpeningPrice", () => {
  it("normalizes, retrieves, and persists a successful lookup", async () => {
    const provider: StockQuoteProvider = {
      getQuote: vi.fn().mockResolvedValue(quote),
    };
    const repository: QuoteSearchRepository = {
      save: vi.fn().mockResolvedValue("search-123"),
      recent: vi.fn().mockResolvedValue([]),
    };

    await expect(
      searchOpeningPrice(" aapl ", "user-123", { provider, repository }),
    ).resolves.toEqual({ ...quote, searchId: "search-123" });
    expect(provider.getQuote).toHaveBeenCalledWith("AAPL");
    expect(repository.save).toHaveBeenCalledWith("user-123", quote);
  });

  it("does not persist when the provider fails", async () => {
    const provider: StockQuoteProvider = {
      getQuote: vi.fn().mockRejectedValue(new Error("provider failed")),
    };
    const repository: QuoteSearchRepository = {
      save: vi.fn(),
      recent: vi.fn().mockResolvedValue([]),
    };

    await expect(
      searchOpeningPrice("AAPL", "user-123", { provider, repository }),
    ).rejects.toThrow("provider failed");
    expect(repository.save).not.toHaveBeenCalled();
  });
});
