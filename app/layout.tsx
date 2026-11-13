import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import React from "react";
import "./globals.css";
import { AuthProvider } from './lib/auth-context';
import { NotificationProvider } from './components/NotificationProvider';

// ── Sans-serif — Geist (interface / body copy) ────────────────────────────────
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

// ── NOTE on Cormorant Garamond (editorial serif) ─────────────────────────────
// Cormorant Garamond is loaded via a CSS @import in globals.css so it does not
// require a build-time Google Fonts fetch (which fails in offline/proxy build
// environments). It is used only for display headings (.font-display, .text-display-*)
// so it degrades gracefully to Georgia when unavailable.

export const metadata: Metadata = {
  title: "Lodgen — Book verified hotels across Nigeria",
  description:
    "Discover and book premium hotels across Lagos, Abuja, Port Harcourt and more Nigerian cities.",
  icons: {
    icon: [
      { url: "/favicon.ico",        sizes: "any",           rel: "shortcut icon" },
      { url: "/favicon-16x16.png",  sizes: "16x16",  type: "image/png" },
      { url: "/favicon-32x32.png",  sizes: "32x32",  type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    other: [
      { rel: "manifest", url: "/site.webmanifest" },
    ],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={[
        geistSans.variable,
        geistMono.variable,
        "h-full antialiased",
      ].join(" ")}
    >
      {/*
        The body's font-family is set in globals.css via the --font-sans custom
        property, which resolves to var(--font-geist-sans) — the CSS variable
        injected by next/font above.  We do NOT add a Tailwind `font-sans` class
        here because Tailwind v4 reads --font-sans from the @theme block we
        defined in globals.css, which would create a circular reference.
        Instead globals.css sets `font-family: var(--font-sans)` on body directly.
      */}
      <body className="min-h-full flex flex-col">
        <AuthProvider><NotificationProvider>{children}</NotificationProvider></AuthProvider>
      </body>
    </html>
  );
}
