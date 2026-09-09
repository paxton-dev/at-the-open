import { z } from "zod";

import { config } from "@/lib/config";

import {
  QuoteProviderError,
  SymbolNotFoundError,
} from "./errors";
import type {
  StockQuote,
  StockQuoteProvider,
  StockSymbol,
  StockSymbolSearchProvider,
} from "./types";

const finnhubQuoteSchema = z.object({
  c: z.number(),
  h: z.number(),
  l: z.number(),
  o: z.number(),
  pc: z.number(),
  t: z.number().optional(),
});

const finnhubSymbolSearchSchema = z.object({
  count: z.number(),
  result: z.array(
    z.object({
      description: z.string(),
      displaySymbol: z.string(),
      symbol: z.string(),
      type: z.string(),
    }),
  ),
});

type Fetch = typeof fetch;

export function createFinnhubProvider(
  apiKey = config.finnhubApiKey,
  fetcher: Fetch = fetch,
): StockQuoteProvider {
  return {
    async getQuote(symbol: string): Promise<StockQuote> {
      if (!apiKey) {
        throw new QuoteProviderError(
          "The market data provider is not configured.",
          "configuration",
        );
      }

      let response: Response;

      try {
        const url = new URL("/api/v1/quote", config.finnhubBaseUrl);
        url.searchParams.set("symbol", symbol);

        response = await fetcher(url, {
          headers: { "X-Finnhub-Token": apiKey },
          cache: "no-store",
          signal: AbortSignal.timeout(5_000),
        });
      } catch {
        throw new QuoteProviderError(
          "Market data is temporarily unavailable. Try again shortly.",
          "unavailable",
        );
      }

      if (response.status === 429) {
        throw new QuoteProviderError(
          "Market data is busy right now. Try again in a moment.",
          "rate-limit",
        );
      }

      if (!response.ok) {
        throw new QuoteProviderError(
          "Market data is temporarily unavailable. Try again shortly.",
          "unavailable",
        );
      }

      let payload: unknown;

      try {
        payload = await response.json();
      } catch {
        throw new QuoteProviderError(
          "The market data provider returned an unexpected response.",
          "unavailable",
        );
      }

      const parsed = finnhubQuoteSchema.safeParse(payload);

      if (!parsed.success) {
        throw new QuoteProviderError(
          "The market data provider returned an unexpected response.",
          "unavailable",
        );
      }

      if (parsed.data.o <= 0) {
        throw new SymbolNotFoundError(symbol);
      }

      return {
        symbol,
        openingPrice: parsed.data.o,
        currentPrice: parsed.data.c,
        highPrice: parsed.data.h,
        lowPrice: parsed.data.l,
        previousClose: parsed.data.pc,
        currency: "USD",
        provider: "finnhub",
        providerTimestamp: parsed.data.t
          ? new Date(parsed.data.t * 1_000)
          : null,
      };
    },
  };
}

export const finnhubProvider = createFinnhubProvider();

export function createFinnhubSymbolSearchProvider(
  apiKey = config.finnhubApiKey,
  fetcher: Fetch = fetch,
): StockSymbolSearchProvider {
  return {
    async search(query: string): Promise<StockSymbol[]> {
      if (!apiKey) {
        throw new QuoteProviderError(
          "The market data provider is not configured.",
          "configuration",
        );
      }

      let response: Response;

      try {
        const url = new URL("/api/v1/search", config.finnhubBaseUrl);
        url.searchParams.set("q", query);
        url.searchParams.set("exchange", "US");

        response = await fetcher(url, {
          headers: { "X-Finnhub-Token": apiKey },
          cache: "no-store",
          signal: AbortSignal.timeout(5_000),
        });
      } catch {
        throw new QuoteProviderError(
          "Symbol search is temporarily unavailable. Try again shortly.",
          "unavailable",
        );
      }

      if (response.status === 429) {
        throw new QuoteProviderError(
          "Symbol search is busy right now. Try again in a moment.",
          "rate-limit",
        );
      }

      if (!response.ok) {
        throw new QuoteProviderError(
          "Symbol search is temporarily unavailable. Try again shortly.",
          "unavailable",
        );
      }

      let payload: unknown;

      try {
        payload = await response.json();
      } catch {
        throw new QuoteProviderError(
          "The market data provider returned an unexpected response.",
          "unavailable",
        );
      }

      const parsed = finnhubSymbolSearchSchema.safeParse(payload);

      if (!parsed.success) {
        throw new QuoteProviderError(
          "The market data provider returned an unexpected response.",
          "unavailable",
        );
      }

      const seen = new Set<string>();
      const normalizedQuery = query.trim().toUpperCase();

      return parsed.data.result
        .filter((result) => {
          if (!result.symbol || seen.has(result.symbol)) return false;
          seen.add(result.symbol);
          return true;
        })
        .sort((left, right) => {
          const relevance =
            symbolMatchScore(left, normalizedQuery) -
            symbolMatchScore(right, normalizedQuery);

          return (
            relevance ||
            left.description.length - right.description.length ||
            left.displaySymbol.localeCompare(right.displaySymbol)
          );
        })
        .slice(0, 8)
        .map(({ symbol, displaySymbol, description }) => ({
          symbol,
          displaySymbol,
          description,
        }));
    },
  };
}

export const finnhubSymbolSearchProvider =
  createFinnhubSymbolSearchProvider();

function symbolMatchScore(
  result: z.infer<typeof finnhubSymbolSearchSchema>["result"][number],
  query: string,
) {
  const symbol = result.displaySymbol.toUpperCase();
  const description = result.description.toUpperCase();

  if (symbol === query) return 0;
  if (symbol.startsWith(query)) return 1;
  if (description === query) return 2;
  if (description.startsWith(query)) return 3;
  if (description.split(/\s+/).some((word) => word.startsWith(query))) return 4;
  if (symbol.includes(query)) return 5;
  if (description.includes(query)) return 6;
  return 7;
}
