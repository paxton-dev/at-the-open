export class InvalidSymbolError extends Error {
  constructor() {
    super("Enter a valid US stock symbol.");
    this.name = "InvalidSymbolError";
  }
}

export class SymbolNotFoundError extends Error {
  constructor(symbol: string) {
    super(`We couldn't find “${symbol}.” Check the symbol and try again.`);
    this.name = "SymbolNotFoundError";
  }
}

export class QuoteProviderError extends Error {
  constructor(
    message: string,
    public readonly reason: "configuration" | "rate-limit" | "unavailable",
  ) {
    super(message);
    this.name = "QuoteProviderError";
  }
}
