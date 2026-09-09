import Link from "next/link";

import { SiteHeader } from "@/components/site-header";

import { AuthForm } from "./auth-form";
import styles from "./auth-shell.module.css";

type AuthShellProps = {
  mode: "sign-in" | "sign-up";
};

export function AuthShell({ mode }: AuthShellProps) {
  const isSignUp = mode === "sign-up";

  return (
    <main id="main-content" className={styles.page}>
      <SiteHeader>
        <nav className={styles.nav} aria-label="Account">
          <Link className={styles.navLink} href="/sign-in">
            Sign in
          </Link>
          <Link className={styles.navAction} href="/sign-up">
            Create account
          </Link>
        </nav>
      </SiteHeader>

      <div className={styles.content}>
        <section className={styles.formPanel}>
          <AuthForm mode={mode} />
          <p className={styles.switchMode}>
            {isSignUp ? "Already have an account?" : "New here?"}{" "}
            <Link href={isSignUp ? "/sign-in" : "/sign-up"}>
              {isSignUp ? "Sign in" : "Create an account"}
            </Link>
          </p>
        </section>
      </div>

      <footer className={styles.footer}>
        <span>Data by Finnhub</span>
        <span>Informational use only</span>
      </footer>
    </main>
  );
}
