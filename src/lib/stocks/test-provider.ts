import type {
  StockQuoteProvider,
  StockSymbol,
  StockSymbolSearchProvider,
} from "./types";

const prices = {
  AAPL: { open: 231.42, current: 234.08, high: 235.1, low: 229.3, previous: 230.17 },
  MSFT: { open: 502.11, current: 506.72, high: 508.3, low: 499.84, previous: 501.06 },
  NVDA: { open: 176.08, current: 178.44, high: 179.22, low: 174.91, previous: 175.63 },
  AMZN: { open: 226.31, current: 228.15, high: 229.04, low: 224.88, previous: 225.97 },
} as const;

export const testQuoteProvider: StockQuoteProvider = {
  async getQuote(symbol) {
    const quote = prices[symbol as keyof typeof prices];

    if (!quote) {
      const { SymbolNotFoundError } = await import("./errors");
      throw new SymbolNotFoundError(symbol);
    }

    return {
      symbol,
      openingPrice: quote.open,
      currentPrice: quote.current,
      highPrice: quote.high,
      lowPrice: quote.low,
      previousClose: quote.previous,
      currency: "USD",
      provider: "test",
      providerTimestamp: new Date("2026-09-02T20:00:00.000Z"),
    };
  },
};

const symbols: StockSymbol[] = [
  { symbol: "AAPL", displaySymbol: "AAPL", description: "APPLE INC" },
  { symbol: "AMZN", displaySymbol: "AMZN", description: "AMAZON.COM INC" },
  { symbol: "MSFT", displaySymbol: "MSFT", description: "MICROSOFT CORP" },
  { symbol: "NVDA", displaySymbol: "NVDA", description: "NVIDIA CORP" },
];

export const testSymbolSearchProvider: StockSymbolSearchProvider = {
  async search(query) {
    const normalized = query.trim().toUpperCase();

    return symbols.filter(
      (symbol) =>
        symbol.symbol.includes(normalized) ||
        symbol.description.includes(normalized),
    );
  },
};
