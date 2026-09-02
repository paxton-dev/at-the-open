import Link from "next/link";

import { Brand } from "@/components/brand";

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
      <header className={styles.header}>
        <Brand />
        <nav className={styles.nav} aria-label="Account">
          <Link className={styles.textLink} href="/sign-in">
            Sign in
          </Link>
          <Link className={styles.navAction} href="/sign-up">
            Create account <span aria-hidden="true">→</span>
          </Link>
        </nav>
      </header>

      <section className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>Market data / One clear answer</p>
          <h1>
            Where did
            <br />
            the day <em>begin?</em>
          </h1>
        </div>

        <div className={styles.heroFooter}>
          <p>
            Look up the latest reported opening price for a US stock and keep a
            private record of the symbols you research.
          </p>
          <Link className={styles.primaryAction} href="/sign-up">
            Check the open <span aria-hidden="true">→</span>
          </Link>
        </div>
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
        <span className={styles.tapeLabel}>Illustrative prices</span>
      </section>

      <footer className={styles.footer}>
        <span>Opening prices without the noise.</span>
        <span>Data by Finnhub · Informational use only</span>
      </footer>
    </main>
  );
}
