import { describe, expect, it } from "vitest";

import { InvalidSymbolError } from "./errors";
import { normalizeSymbol } from "./symbol";

describe("normalizeSymbol", () => {
  it("normalizes whitespace and casing", () => {
    expect(normalizeSymbol("  aapl ")).toBe("AAPL");
  });

  it.each(["", "not a ticker", "$AAPL", "TOO-LONG-SYMBOL"])(
    "rejects %j",
    (symbol) => {
      expect(() => normalizeSymbol(symbol)).toThrow(InvalidSymbolError);
    },
  );
});
