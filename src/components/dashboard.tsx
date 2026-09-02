"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { Brand } from "@/components/brand";
import { authClient } from "@/lib/auth-client";

import styles from "./dashboard.module.css";

type DisplayQuote = {
  symbol: string;
  openingPrice: number;
  currentPrice: number;
  highPrice: number;
  lowPrice: number;
  previousClose: number;
  currency: "USD";
  provider: "finnhub" | "test";
  providerTimestamp: string | null;
  searchId: string;
};

type RecentSearch = {
  id: string;
  symbol: string;
  openingPrice: number;
  currency: "USD";
  provider: "finnhub" | "test";
  providerTimestamp: string | null;
  searchedAt: string;
};

type DashboardProps = {
  userName: string;
  initialRecent: RecentSearch[];
};

export function Dashboard({ userName, initialRecent }: DashboardProps) {
  const router = useRouter();
  const [quote, setQuote] = useState<DisplayQuote | null>(null);
  const [recent, setRecent] = useState(initialRecent);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const symbol = String(form.get("symbol") ?? "");

    setPending(true);
    setError(null);

    try {
      const response = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol }),
      });
      const payload = (await response.json()) as {
        quote?: DisplayQuote;
        error?: string;
      };

      if (!response.ok || !payload.quote) {
        throw new Error(payload.error ?? "We couldn't complete that search.");
      }

      setQuote(payload.quote);
      setRecent((current) => [
        {
          id: payload.quote!.searchId,
          symbol: payload.quote!.symbol,
          openingPrice: payload.quote!.openingPrice,
          currency: payload.quote!.currency,
          provider: payload.quote!.provider,
          providerTimestamp: payload.quote!.providerTimestamp,
          searchedAt: new Date().toISOString(),
        },
        ...current,
      ].slice(0, 5));
    } catch (caught) {
      setQuote(null);
      setError(
        caught instanceof Error
          ? caught.message
          : "Something went wrong. Try again.",
      );
    } finally {
      setPending(false);
    }
  }

  async function handleSignOut() {
    await authClient.signOut();
    router.push("/sign-in");
    router.refresh();
  }

  return (
    <main id="main-content" className={styles.page}>
      <header className={styles.header}>
        <Brand />
        <div className={styles.account}>
          <span>Signed in as {firstName(userName)}</span>
          <button type="button" onClick={handleSignOut}>
            Log out
          </button>
        </div>
      </header>

      <div className={styles.content}>
        <div className={styles.workspace}>
          <section>
            <p className={styles.kicker}>01 — Stock lookup / US equities</p>
            <h1>
              Where did
              <br />
              the day
              <br />
              <em>begin?</em>
            </h1>

            <form className={styles.search} onSubmit={handleSearch}>
              <label className="srOnly" htmlFor="symbol">
                Stock symbol
              </label>
              <input
                id="symbol"
                name="symbol"
                type="text"
                placeholder="Enter a symbol"
                autoComplete="off"
                autoCapitalize="characters"
                maxLength={10}
                spellCheck={false}
                required
              />
              <button type="submit" disabled={pending} aria-label="Check the open">
                {pending ? <span className={styles.spinner} /> : "→"}
              </button>
            </form>
            <p className={styles.hint}>Try AAPL, MSFT, NVDA, or AMZN</p>
          </section>

          <section className={styles.resultRegion} aria-live="polite">
            {pending ? <LoadingState /> : null}
            {!pending && error ? <ErrorState message={error} /> : null}
            {!pending && !error && quote ? <QuoteResult quote={quote} /> : null}
            {!pending && !error && !quote ? <EmptyState /> : null}
          </section>
        </div>

        <section className={styles.recent} aria-labelledby="recent-title">
          <div className={styles.sectionHeading}>
            <h2 id="recent-title">02 — Recent opens</h2>
            <span>{recent.length} saved searches</span>
          </div>

          {recent.length ? (
            <div className={styles.history}>
              {recent.map((search) => (
                <div className={styles.historyRow} key={search.id}>
                  <strong>{search.symbol}</strong>
                  <span>Latest reported session</span>
                  <b>{formatCurrency(search.openingPrice)}</b>
                  <time dateTime={search.searchedAt}>
                    {formatRelativeDate(search.searchedAt)}
                  </time>
                </div>
              ))}
            </div>
          ) : (
            <p className={styles.noHistory}>
              Your successful searches will appear here.
            </p>
          )}
        </section>
      </div>

      <footer className={styles.footer}>
        <span>Data by Finnhub</span>
        <span>Prices are informational and may be delayed · Not investment advice</span>
      </footer>
    </main>
  );
}

function QuoteResult({ quote }: { quote: DisplayQuote }) {
  return (
    <div className={styles.result}>
      <div className={styles.resultHeading}>
        <div>
          <p>Opening price</p>
          <h2>{quote.symbol}</h2>
        </div>
        <span className={styles.status}>
          <i /> Latest session
        </span>
      </div>
      <strong className={styles.price}>{formatCurrency(quote.openingPrice)}</strong>
      <p className={styles.timestamp}>
        US equity · USD
        {quote.providerTimestamp
          ? ` · Reported ${formatTimestamp(quote.providerTimestamp)}`
          : ""}
      </p>
      <dl className={styles.metrics}>
        <div><dt>Current</dt><dd>{formatCurrency(quote.currentPrice)}</dd></div>
        <div><dt>High</dt><dd>{formatCurrency(quote.highPrice)}</dd></div>
        <div><dt>Low</dt><dd>{formatCurrency(quote.lowPrice)}</dd></div>
        <div><dt>Previous</dt><dd>{formatCurrency(quote.previousClose)}</dd></div>
      </dl>
    </div>
  );
}

function EmptyState() {
  return (
    <div className={styles.state}>
      <div><p>Ready when you are</p><strong>—</strong></div>
      <span>Enter a US stock symbol to see its latest reported opening price.</span>
    </div>
  );
}

function LoadingState() {
  return (
    <div className={styles.state}>
      <div><p>Checking the market</p><strong>···</strong></div>
      <span>Retrieving the latest reported session from Finnhub.</span>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className={`${styles.state} ${styles.error}`} role="alert">
      <div><p>Couldn&apos;t retrieve quote</p><strong>?</strong></div>
      <span>{message} Your recent opens were not changed.</span>
    </div>
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(value);
}

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(new Date(value));
}

function formatRelativeDate(value: string) {
  const date = new Date(value);
  const elapsed = Date.now() - date.getTime();

  if (elapsed < 60_000) return "Just now";
  if (elapsed < 3_600_000) return `${Math.floor(elapsed / 60_000)}m ago`;
  if (elapsed < 86_400_000) return `${Math.floor(elapsed / 3_600_000)}h ago`;

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
}

function firstName(name: string) {
  return name.trim().split(/\s+/)[0] || "you";
}
