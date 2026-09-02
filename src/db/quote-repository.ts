import { desc, eq } from "drizzle-orm";

import { db } from "@/db/client";
import { quoteSearch } from "@/db/schema";
import type {
  QuoteSearchRecord,
  QuoteSearchRepository,
  StockQuote,
} from "@/lib/stocks/types";

export const quoteSearchRepository: QuoteSearchRepository = {
  async save(userId: string, quote: StockQuote) {
    const id = crypto.randomUUID();

    await db.insert(quoteSearch).values({
      id,
      userId,
      symbol: quote.symbol,
      openingPrice: String(quote.openingPrice),
      currency: quote.currency,
      provider: quote.provider,
      providerTimestamp: quote.providerTimestamp,
    });

    return id;
  },

  async recent(userId: string, limit = 5): Promise<QuoteSearchRecord[]> {
    const rows = await db
      .select({
        id: quoteSearch.id,
        symbol: quoteSearch.symbol,
        openingPrice: quoteSearch.openingPrice,
        currency: quoteSearch.currency,
        provider: quoteSearch.provider,
        providerTimestamp: quoteSearch.providerTimestamp,
        searchedAt: quoteSearch.searchedAt,
      })
      .from(quoteSearch)
      .where(eq(quoteSearch.userId, userId))
      .orderBy(desc(quoteSearch.searchedAt))
      .limit(limit);

    return rows.map((row) => ({
      ...row,
      openingPrice: Number(row.openingPrice),
    }));
  },
};
