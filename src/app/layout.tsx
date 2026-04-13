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

export const metadata: Metadata = {
  title: "DeFi Sweeper — Find & Recover Forgotten DeFi Positions",
  description:
    "AI agent that scans your wallet for stale DeFi positions, scores their health, and executes one-click cleanup on X Layer.",
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
