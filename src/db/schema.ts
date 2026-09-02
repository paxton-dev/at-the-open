import { relations } from "drizzle-orm";
import { index, numeric, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export * from "./auth-schema";

import { user } from "./auth-schema";

export const quoteSearch = pgTable(
  "quote_search",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    symbol: text("symbol").notNull(),
    openingPrice: numeric("opening_price", {
      precision: 18,
      scale: 4,
    }).notNull(),
    currency: text("currency", { enum: ["USD"] }).default("USD").notNull(),
    provider: text("provider", { enum: ["finnhub", "test"] })
      .default("finnhub")
      .notNull(),
    providerTimestamp: timestamp("provider_timestamp", {
      withTimezone: true,
    }),
    searchedAt: timestamp("searched_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("quote_search_user_searched_at_idx").on(
      table.userId,
      table.searchedAt,
    ),
  ],
);

export const quoteSearchRelations = relations(quoteSearch, ({ one }) => ({
  user: one(user, {
    fields: [quoteSearch.userId],
    references: [user.id],
  }),
}));
