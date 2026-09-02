import { z } from "zod";

import { config } from "@/lib/config";

import {
  QuoteProviderError,
  SymbolNotFoundError,
} from "./errors";
import type { StockQuote, StockQuoteProvider } from "./types";

const finnhubQuoteSchema = z.object({
  c: z.number(),
  h: z.number(),
  l: z.number(),
  o: z.number(),
  pc: z.number(),
  t: z.number().optional(),
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
