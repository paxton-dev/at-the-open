import Link from "next/link";

import { SiteHeader } from "@/components/site-header";

import styles from "./page.module.css";

const exampleStocks = [
  ["AAPL", "$231.42"],
  ["MSFT", "$502.11"],
  ["NVDA", "$176.08"],
  ["AMZN", "$226.31"],
  ["META", "$738.70"],
  ["GOOGL", "$212.65"],
  ["TSLA", "$334.24"],
  ["AMD", "$163.02"],
] as const;

export default function HomePage() {
  return (
    <main id="main-content" className={styles.page}>
      <SiteHeader>
        <nav className={styles.nav} aria-label="Account">
          <Link className={styles.textLink} href="/sign-in">
            Sign in
          </Link>
          <Link className={styles.navAction} href="/sign-up">
            Create account <span aria-hidden="true">→</span>
          </Link>
        </nav>
      </SiteHeader>

      <section className={styles.hero}>
        <p className={styles.eyebrow}>Opening prices without the noise</p>
        <h1>
          Where the market
          <br />
          day <span>began.</span>
        </h1>
        <p className={styles.summary}>
          Look up the latest reported opening price for any US stock and keep a
          private record of the symbols you research.
        </p>
        <Link className={styles.primaryAction} href="/sign-up">
          Check the open <span aria-hidden="true">→</span>
        </Link>
      </section>

      <section className={styles.tape} aria-label="Example opening prices">
        <div className={styles.tapeTrack}>
          {[0, 1].map((copy) => (
            <div
              className={styles.tapeGroup}
              key={copy}
              aria-hidden={copy === 1 ? "true" : undefined}
            >
              {exampleStocks.map(([symbol, price]) => (
                <div className={styles.tapeItem} key={`${copy}-${symbol}`}>
                  <span>{symbol}</span>
                  <strong>{price}</strong>
                  <i>OPEN</i>
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>

      <footer className={styles.footer}>
        <span>Data by Finnhub</span>
        <span>Illustrative prices · Informational use only</span>
      </footer>
    </main>
  );
}
