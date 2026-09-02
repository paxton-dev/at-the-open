import type { Metadata } from "next";
import { Instrument_Serif, Space_Grotesk, Space_Mono } from "next/font/google";

import "./globals.css";

const display = Instrument_Serif({
  variable: "--font-display",
  subsets: ["latin"],
  weight: "400",
});

const sans = Space_Grotesk({
  variable: "--font-sans",
  subsets: ["latin"],
});

const mono = Space_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
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
      <body className={`${display.variable} ${sans.variable} ${mono.variable}`}>
        <a className="skipLink" href="#main-content">
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  );
}
