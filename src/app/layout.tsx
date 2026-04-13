import type { Metadata } from "next";
import { Red_Hat_Display, Red_Hat_Text, JetBrains_Mono } from "next/font/google";
import { Web3Provider } from "@/providers/web3-provider";
import { Header } from "@/components/header";
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
        {/* Background gradient (from Figma) */}
        <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/3 w-[90%] h-[80%]"
            style={{
              background: "linear-gradient(135deg, rgba(255,255,255,0) 0%, rgba(190,170,255,0.30) 20%, rgba(140,130,255,0.40) 35%, rgba(120,110,255,0.35) 50%, rgba(180,140,220,0.30) 65%, rgba(220,140,180,0.25) 80%, rgba(255,255,255,0) 100%)",
              filter: "blur(100px)",
            }}
          />
        </div>
        <div className="relative z-10 flex flex-col min-h-full">
          <Web3Provider>
            <Header />
            {children}
          </Web3Provider>
        </div>
      </body>
    </html>
  );
}
