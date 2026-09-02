import type { QuoteSearchRepository, StockQuoteProvider } from "./types";
import { normalizeSymbol } from "./symbol";

type SearchDependencies = {
  provider: StockQuoteProvider;
  repository: QuoteSearchRepository;
};

export async function searchOpeningPrice(
  input: unknown,
  userId: string,
  { provider, repository }: SearchDependencies,
) {
  const symbol = normalizeSymbol(input);
  const quote = await provider.getQuote(symbol);
  const searchId = await repository.save(userId, quote);

  return { ...quote, searchId };
}
