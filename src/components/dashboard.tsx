"use client";

import { useRouter } from "next/navigation";
import {
  ChangeEvent,
  FormEvent,
  KeyboardEvent,
  useEffect,
  useId,
  useState,
} from "react";

import { Brand } from "@/components/brand";
import { authClient } from "@/lib/auth-client";
import type { StockSymbol } from "@/lib/stocks/types";

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

const symbolSearchCache = new Map<string, StockSymbol[]>();

export function Dashboard({ userName, initialRecent }: DashboardProps) {
  const router = useRouter();
  const [quote, setQuote] = useState<DisplayQuote | null>(null);
  const [recent, setRecent] = useState(initialRecent);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSearch(symbol: string) {
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

            <SymbolCombobox pending={pending} onSearch={handleSearch} />
          </section>

          {pending || error || quote ? (
            <section className={styles.resultRegion} aria-live="polite">
              {pending ? <LoadingState /> : null}
              {!pending && error ? <ErrorState message={error} /> : null}
              {!pending && !error && quote ? <QuoteResult quote={quote} /> : null}
            </section>
          ) : null}
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

type SymbolComboboxProps = {
  pending: boolean;
  onSearch: (symbol: string) => Promise<void>;
};

function SymbolCombobox({ pending, onSearch }: SymbolComboboxProps) {
  const listboxId = useId();
  const [inputValue, setInputValue] = useState("");
  const [selected, setSelected] = useState<StockSymbol | null>(null);
  const [suggestions, setSuggestions] = useState<StockSymbol[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [open, setOpen] = useState(false);
  const [searchState, setSearchState] = useState<
    "idle" | "loading" | "ready" | "error"
  >("idle");

  useEffect(() => {
    const query = inputValue.trim();

    if (!query || selected) {
      return;
    }

    const cacheKey = query.toUpperCase();
    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      const cached = symbolSearchCache.get(cacheKey);

      if (cached) {
        setSuggestions(cached);
        setHighlightedIndex(cached.length ? 0 : -1);
        setOpen(true);
        setSearchState("ready");
        return;
      }

      setSearchState("loading");
      setOpen(true);

      try {
        const response = await fetch(
          `/api/symbols?q=${encodeURIComponent(query)}`,
          { signal: controller.signal },
        );
        const payload = (await response.json()) as {
          symbols?: StockSymbol[];
          error?: string;
        };

        if (!response.ok || !payload.symbols) {
          throw new Error(payload.error ?? "Symbol search is unavailable.");
        }

        symbolSearchCache.set(cacheKey, payload.symbols);
        setSuggestions(payload.symbols);
        setHighlightedIndex(payload.symbols.length ? 0 : -1);
        setSearchState("ready");
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setSuggestions([]);
        setHighlightedIndex(-1);
        setSearchState("error");
      }
    }, 250);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [inputValue, selected]);

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    setInputValue(event.target.value);
    setSelected(null);
    setSuggestions([]);
    setHighlightedIndex(-1);
    setOpen(false);
    setSearchState("idle");
  }

  function selectSymbol(symbol: StockSymbol) {
    setSelected(symbol);
    setInputValue(symbol.displaySymbol);
    setSuggestions([]);
    setHighlightedIndex(-1);
    setOpen(false);
    setSearchState("idle");
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      setOpen(false);
      return;
    }

    if (!suggestions.length) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setHighlightedIndex((current) => (current + 1) % suggestions.length);
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setOpen(true);
      setHighlightedIndex((current) =>
        current <= 0 ? suggestions.length - 1 : current - 1,
      );
    }

    if (event.key === "Enter" && open) {
      event.preventDefault();
      const highlighted = suggestions[highlightedIndex];
      if (highlighted) selectSymbol(highlighted);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (selected && !pending) void onSearch(selected.symbol);
  }

  const activeOptionId =
    open && highlightedIndex >= 0
      ? `${listboxId}-option-${highlightedIndex}`
      : undefined;

  return (
    <div className={styles.symbolPicker}>
      <form className={styles.search} onSubmit={handleSubmit}>
        <label className="srOnly" htmlFor="symbol">
          Stock symbol or company
        </label>
        <input
          id="symbol"
          type="text"
          role="combobox"
          placeholder="Search symbol or company"
          value={inputValue}
          autoComplete="off"
          autoCapitalize="characters"
          maxLength={64}
          spellCheck={false}
          aria-autocomplete="list"
          aria-controls={listboxId}
          aria-expanded={open}
          aria-activedescendant={activeOptionId}
          aria-describedby="symbol-hint"
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length || searchState !== "idle") setOpen(true);
          }}
          onBlur={() => setOpen(false)}
        />
        {selected ? (
          <span className={styles.verified} aria-label="Verified symbol">
            ✓
          </span>
        ) : null}
        <button
          type="submit"
          disabled={pending || !selected}
          aria-label="Check the open"
        >
          {pending ? <span className={styles.spinner} /> : "→"}
        </button>
      </form>

      <div
        id={listboxId}
        className={`${styles.suggestions} ${open ? styles.suggestionsOpen : ""}`}
        role="listbox"
        aria-label="Matching US stock symbols"
      >
        {searchState === "loading" ? (
          <p className={styles.suggestionState} role="status">
            Searching listed symbols…
          </p>
        ) : null}

        {searchState === "error" ? (
          <p className={`${styles.suggestionState} ${styles.suggestionError}`} role="status">
            Symbol search is unavailable. Try again.
          </p>
        ) : null}

        {searchState === "ready" && !suggestions.length ? (
          <p className={styles.suggestionState} role="status">
            No matching US symbols found.
          </p>
        ) : null}

        {suggestions.map((symbol, index) => (
          <div
            id={`${listboxId}-option-${index}`}
            className={`${styles.suggestion} ${
              index === highlightedIndex ? styles.suggestionActive : ""
            }`}
            key={symbol.symbol}
            role="option"
            aria-selected={index === highlightedIndex}
            onMouseDown={(event) => {
              event.preventDefault();
              selectSymbol(symbol);
            }}
          >
            <strong>{symbol.displaySymbol}</strong>
            <span>{symbol.description}</span>
          </div>
        ))}
      </div>

      <p className={styles.hint} id="symbol-hint">
        {selected
          ? `${selected.description} · verified US listing`
          : inputValue.trim()
            ? "Choose a verified result to continue"
            : "Search by ticker or company name"}
      </p>
    </div>
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
