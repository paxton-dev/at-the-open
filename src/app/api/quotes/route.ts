import { auth } from "@/lib/auth";
import { assertExternalServicesConfigured, config } from "@/lib/config";
import { quoteSearchRepository } from "@/db/quote-repository";
import {
  InvalidSymbolError,
  QuoteProviderError,
  SymbolNotFoundError,
} from "@/lib/stocks/errors";
import { finnhubProvider } from "@/lib/stocks/finnhub";
import { searchOpeningPrice } from "@/lib/stocks/quote-service";
import { testQuoteProvider } from "@/lib/stocks/test-provider";

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session) {
    return Response.json({ error: "Authentication required." }, { status: 401 });
  }

  assertExternalServicesConfigured();
  const recent = await quoteSearchRepository.recent(session.user.id);

  return Response.json({ recent });
}

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session) {
    return Response.json(
      { error: "Authentication required.", requestId },
      { status: 401 },
    );
  }

  let body: { symbol?: unknown };

  try {
    body = (await request.json()) as { symbol?: unknown };
  } catch {
    return Response.json(
      { error: "The request body must be valid JSON.", requestId },
      { status: 400 },
    );
  }

  try {
    assertExternalServicesConfigured();
    const quote = await searchOpeningPrice(body.symbol, session.user.id, {
      provider:
        config.marketDataMode === "test" ? testQuoteProvider : finnhubProvider,
      repository: quoteSearchRepository,
    });

    console.info(
      JSON.stringify({
        level: "info",
        event: "quote.searched",
        requestId,
        userId: session.user.id,
        symbol: quote.symbol,
      }),
    );

    return Response.json({ quote, requestId });
  } catch (error) {
    const response = errorResponse(error, requestId);

    console.error(
      JSON.stringify({
        level: "error",
        event: "quote.search_failed",
        requestId,
        userId: session.user.id,
        error: error instanceof Error ? error.name : "UnknownError",
      }),
    );

    return response;
  }
}

function errorResponse(error: unknown, requestId: string) {
  if (error instanceof InvalidSymbolError) {
    return Response.json({ error: error.message, requestId }, { status: 400 });
  }

  if (error instanceof SymbolNotFoundError) {
    return Response.json({ error: error.message, requestId }, { status: 404 });
  }

  if (error instanceof QuoteProviderError) {
    const status = error.reason === "rate-limit" ? 429 : 503;
    return Response.json({ error: error.message, requestId }, { status });
  }

  return Response.json(
    { error: "Something went wrong. Try again.", requestId },
    { status: 500 },
  );
}
