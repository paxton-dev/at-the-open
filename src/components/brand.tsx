import Link from "next/link";

import styles from "./brand.module.css";

type BrandProps = {
  dark?: boolean;
};

export function Brand({ dark = false }: BrandProps) {
  return (
    <Link
      className={`${styles.brand} ${dark ? styles.dark : ""}`}
      href="/"
      aria-label="At The Open home"
    >
      AT THE OPEN<span>✦</span>
    </Link>
  );
}
