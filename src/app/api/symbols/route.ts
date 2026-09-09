import { z } from "zod";

import { auth } from "@/lib/auth";
import { assertExternalServicesConfigured, config } from "@/lib/config";
import { QuoteProviderError } from "@/lib/stocks/errors";
import { finnhubSymbolSearchProvider } from "@/lib/stocks/finnhub";
import { testSymbolSearchProvider } from "@/lib/stocks/test-provider";

const querySchema = z.string().trim().min(1).max(64);

export async function GET(request: Request) {
  const requestId = crypto.randomUUID();
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session) {
    return Response.json(
      { error: "Authentication required.", requestId },
      { status: 401 },
    );
  }

  const query = querySchema.safeParse(new URL(request.url).searchParams.get("q"));

  if (!query.success) {
    return Response.json(
      { error: "Enter between 1 and 64 characters.", requestId },
      { status: 400 },
    );
  }

  try {
    assertExternalServicesConfigured();
    const provider =
      config.marketDataMode === "test"
        ? testSymbolSearchProvider
        : finnhubSymbolSearchProvider;
    const symbols = await provider.search(query.data);

    return Response.json(
      { symbols, requestId },
      {
        headers: {
          "Cache-Control": "private, max-age=300, stale-while-revalidate=600",
        },
      },
    );
  } catch (error) {
    console.error(
      JSON.stringify({
        level: "error",
        event: "symbol.search_failed",
        requestId,
        userId: session.user.id,
        error: error instanceof Error ? error.name : "UnknownError",
      }),
    );

    if (error instanceof QuoteProviderError) {
      const status = error.reason === "rate-limit" ? 429 : 503;
      return Response.json({ error: error.message, requestId }, { status });
    }

    return Response.json(
      { error: "Symbol search is temporarily unavailable.", requestId },
      { status: 500 },
    );
  }
}
