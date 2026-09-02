import Link from "next/link";

import { Brand } from "@/components/brand";

import { AuthForm } from "./auth-form";
import styles from "./auth-shell.module.css";

type AuthShellProps = {
  mode: "sign-in" | "sign-up";
};

export function AuthShell({ mode }: AuthShellProps) {
  const isSignUp = mode === "sign-up";

  return (
    <main id="main-content" className={styles.page}>
      <section className={styles.story}>
        <Brand dark />
        <div>
          <h2>
            {isSignUp ? (
              <>
                Know where
                <br />
                it started.
              </>
            ) : (
              <>
                Begin at
                <br />
                the beginning.
              </>
            )}
          </h2>
          <p>
            {isSignUp
              ? "Create an account to check opening prices and keep a clean, private history of the symbols you research."
              : "A focused record of where the market day started—saved to your account and ready when you return."}
          </p>
        </div>
        <span className={styles.disclaimer}>
          Market data by Finnhub · Informational use only
        </span>
      </section>

      <section className={styles.formPanel}>
        <AuthForm mode={mode} />
        <p className={styles.switchMode}>
          {isSignUp ? "Already have an account?" : "New here?"}{" "}
          <Link href={isSignUp ? "/sign-in" : "/sign-up"}>
            {isSignUp ? "Sign in" : "Create an account"}
          </Link>
        </p>
      </section>
    </main>
  );
}
