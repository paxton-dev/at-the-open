import type { Metadata } from "next";
import { Archivo, IBM_Plex_Mono } from "next/font/google";

import "./globals.css";

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  weight: "variable",
  axes: ["wdth"],
});

const mono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://open.jamespaxton.io"),
  title: {
    default: "At The Open",
    template: "%s | At The Open",
  },
  description:
    "Look up the latest reported opening price for a US stock and keep a private history of your searches.",
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body className={`${archivo.variable} ${mono.variable}`}>
        <a className="skipLink" href="#main-content">
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  );
}
