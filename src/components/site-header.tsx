import type { ReactNode } from "react";

import { Brand } from "@/components/brand";

import styles from "./site-header.module.css";

export function SiteHeader({ children }: { children: ReactNode }) {
  return (
    <header className={styles.header}>
      <Brand />
      <div className={styles.actions}>{children}</div>
    </header>
  );
}
