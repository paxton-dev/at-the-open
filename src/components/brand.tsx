import Link from "next/link";

import styles from "./brand.module.css";

export function Brand() {
  return (
    <Link
      className={styles.brand}
      href="/"
      aria-label="At The Open home"
    >
      AT THE OPEN
    </Link>
  );
}
