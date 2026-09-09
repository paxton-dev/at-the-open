"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState, useSyncExternalStore } from "react";

import { authClient } from "@/lib/auth-client";

import styles from "./auth-form.module.css";

type AuthFormProps = {
  mode: "sign-in" | "sign-up";
};

const subscribeToHydration = () => () => undefined;

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const hydrated = useSyncExternalStore(
    subscribeToHydration,
    () => true,
    () => false,
  );
  const isSignUp = mode === "sign-up";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");

    const result = isSignUp
      ? await authClient.signUp.email({
          name: String(form.get("name") ?? ""),
          email,
          password,
        })
      : await authClient.signIn.email({ email, password });

    if (result.error) {
      setError(result.error.message || "We couldn't complete that request.");
      setPending(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form className={styles.form} method="post" onSubmit={handleSubmit}>
      <p className={styles.kicker}>
        {isSignUp ? "Get started" : "Welcome back"}
      </p>
      <h1>{isSignUp ? "Create account" : "Sign in"}</h1>
      <p className={styles.intro}>
        A focused record of where the market day started—saved to your account
        and ready when you return.
      </p>

      {isSignUp ? (
        <label className={styles.field}>
          <span>Your name</span>
          <input
            name="name"
            type="text"
            placeholder="First name is fine"
            autoComplete="name"
            maxLength={80}
            required
          />
        </label>
      ) : null}

      <label className={styles.field}>
        <span>Email address</span>
        <input
          name="email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          maxLength={254}
          required
        />
      </label>

      <label className={styles.field}>
        <span>Password</span>
        <input
          name="password"
          type="password"
          placeholder={isSignUp ? "At least 10 characters" : "Your password"}
          autoComplete={isSignUp ? "new-password" : "current-password"}
          minLength={10}
          maxLength={128}
          required
        />
      </label>

      <div className={styles.feedback} aria-live="polite">
        {error ? <p role="alert">{error}</p> : null}
      </div>

      <button
        className={styles.submit}
        type="submit"
        disabled={pending || !hydrated}
      >
        <span>
          {pending
            ? "Please wait…"
            : isSignUp
              ? "Create your account"
              : "Continue to your dashboard"}
        </span>
        <span aria-hidden="true">→</span>
      </button>
    </form>
  );
}
