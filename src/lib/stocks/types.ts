export type StockQuote = {
  symbol: string;
  openingPrice: number;
  currentPrice: number;
  highPrice: number;
  lowPrice: number;
  previousClose: number;
  currency: "USD";
  provider: "finnhub" | "test";
  providerTimestamp: Date | null;
};

export type QuoteSearchRecord = Pick<
  StockQuote,
  "symbol" | "openingPrice" | "currency" | "provider" | "providerTimestamp"
> & {
  id: string;
  searchedAt: Date;
};

export type StockSymbol = {
  symbol: string;
  displaySymbol: string;
  description: string;
};

export interface StockQuoteProvider {
  getQuote(symbol: string): Promise<StockQuote>;
}

export interface StockSymbolSearchProvider {
  search(query: string): Promise<StockSymbol[]>;
}

export interface QuoteSearchRepository {
  save(userId: string, quote: StockQuote): Promise<string>;
  recent(userId: string, limit?: number): Promise<QuoteSearchRecord[]>;
}
