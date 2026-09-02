import { z } from "zod";

import { InvalidSymbolError } from "./errors";

export const symbolSchema = z
  .string()
  .trim()
  .toUpperCase()
  .min(1)
  .max(10)
  .regex(/^[A-Z][A-Z0-9.-]*$/);

export function normalizeSymbol(input: unknown): string {
  const result = symbolSchema.safeParse(input);

  if (!result.success) {
    throw new InvalidSymbolError();
  }

  return result.data;
}
