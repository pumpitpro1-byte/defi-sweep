"use client";

import { WagmiProvider, http } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  RainbowKitProvider,
  lightTheme,
  getDefaultConfig,
  type Theme,
} from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";
import { type Chain } from "viem";

// X Layer Testnet (1952) — where the SweeperRegistry is deployed
const xlayerTestnet: Chain = {
  id: 1952,
  name: "X Layer Testnet",
  nativeCurrency: { name: "OKB", symbol: "OKB", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://testrpc.xlayer.tech"] },
  },
  blockExplorers: {
    default: {
      name: "OKX Explorer",
      url: "https://www.okx.com/web3/explorer/xlayer-test",
    },
  },
  testnet: true,
};

const config = getDefaultConfig({
  appName: "DeFi Sweeper",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "00000000000000000000000000000000",
  chains: [xlayerTestnet],
  transports: {
    [xlayerTestnet.id]: http("https://testrpc.xlayer.tech"),
  },
  ssr: true,
});

const queryClient = new QueryClient();

const customTheme: Theme = {
  ...lightTheme(),
  colors: {
    ...lightTheme().colors,
    accentColor: "#6c6cff",
    accentColorForeground: "#FFFFFF",
    actionButtonBorder: "rgba(0,0,0,0.07)",
    actionButtonBorderMobile: "rgba(0,0,0,0.07)",
    actionButtonSecondaryBackground: "#f2f2f2",
    closeButton: "#545454",
    closeButtonBackground: "#f2f2f2",
    connectButtonBackground: "rgba(242,242,242,0.2)",
    connectButtonBackgroundError: "#e62e24",
    connectButtonInnerBackground: "#f2f2f2",
    connectButtonText: "#121212",
    connectButtonTextError: "#FFFFFF",
    connectionIndicator: "#5a8400",
    downloadBottomCardBackground: "#FAFAFA",
    downloadTopCardBackground: "#FFFFFF",
    error: "#e62e24",
    generalBorder: "#d6d6d6",
    generalBorderDim: "#f0f0f0",
    menuItemBackground: "#FAFAFA",
    modalBackdrop: "rgba(0,0,0,0.3)",
    modalBackground: "#FFFFFF",
    modalBorder: "#d6d6d6",
    modalText: "#121212",
    modalTextDim: "#545454",
    modalTextSecondary: "#757575",
    profileAction: "#FAFAFA",
    profileActionHover: "#f2f2f2",
    profileForeground: "#FFFFFF",
    selectedOptionBorder: "#6c6cff",
    standby: "#f9a606",
  },
  fonts: {
    body: "var(--font-sans), 'Red Hat Text', sans-serif",
  },
  radii: {
    actionButton: "32px",
    connectButton: "12px",
    menuButton: "12px",
    modal: "24px",
    modalMobile: "24px",
  },
  shadows: {
    connectButton: "0px 0px 0px rgba(0,0,0,0)",
    dialog: "0px 0px 40px -12px rgba(0,0,0,0.12)",
    profileDetailsAction: "0px 2px 8px rgba(0,0,0,0.06)",
    selectedOption: "0px 0px 0px 1px #6c6cff",
    selectedWallet: "0px 0px 0px 1px #6c6cff",
    walletLogo: "0px 2px 8px rgba(0,0,0,0.06)",
  },
};

export function Web3Provider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={customTheme}
          modalSize="compact"
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
