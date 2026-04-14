import type { Metadata } from "next";
import { Red_Hat_Display, Red_Hat_Text, JetBrains_Mono } from "next/font/google";
import { Web3Provider } from "@/providers/web3-provider";
import "./globals.css";

const redHatDisplay = Red_Hat_Display({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

const redHatText = Red_Hat_Text({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://defi-sweeper.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "DeFi Sweeper — Find & Recover Forgotten DeFi Positions",
    template: "%s · DeFi Sweeper",
  },
  description:
    "AI agent that scans your wallet for stale DeFi positions, scores their health 0–100, and executes one-click cleanup on X Layer.",
  applicationName: "DeFi Sweeper",
  keywords: [
    "DeFi",
    "X Layer",
    "OKX",
    "wallet scanner",
    "stale positions",
    "yield optimization",
    "AI agent",
    "liquidity pools",
    "staking",
    "one-click cleanup",
  ],
  authors: [{ name: "DeFi Sweeper" }],
  creator: "DeFi Sweeper",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "DeFi Sweeper",
    title: "DeFi Sweeper — Find & Recover Forgotten DeFi Positions",
    description:
      "Scan your wallet for stale DeFi positions, get AI-scored health, and clean them up in one click on X Layer.",
    images: [{ url: "/hero-image.svg", width: 1200, height: 630, alt: "DeFi Sweeper" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "DeFi Sweeper",
    description:
      "AI agent that finds and recovers your forgotten DeFi positions on X Layer.",
    images: ["/hero-image.svg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${redHatDisplay.variable} ${redHatText.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white text-[#121212] relative overflow-x-hidden font-[family-name:var(--font-sans)]">
        <Web3Provider>
          {children}
        </Web3Provider>
      </body>
    </html>
  );
}
