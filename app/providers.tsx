"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GoogleReCaptchaProvider } from "react-google-recaptcha-v3";
import { ReactNode, useState } from "react";
import { createSolanaRpc, createSolanaRpcSubscriptions } from "@solana/kit";
import { PrivyProvider } from "@privy-io/react-auth";
import AuthSync from "../components/AuthSync";

const isProduction = process.env.NODE_ENV === "production";
const SOLANA_NETWORK = isProduction ? "solana:mainnet" : "solana:devnet";
const SOLANA_RPC_URL =
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL ||
  (isProduction
    ? "https://api.mainnet-beta.solana.com"
    : "https://api.devnet.solana.com");
const SOLANA_WSS_URL =
  process.env.NEXT_PUBLIC_SOLANA_WSS_URL ||
  (isProduction
    ? "wss://api.mainnet-beta.solana.com"
    : "wss://api.devnet.solana.com");

export default function Providers({ children }: { children: ReactNode }) {
  // We use useState to ensure the QueryClient is only created once
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            retry: 1,
          },
        },
      }),
  );

  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || ""}
      config={{
        appearance: {
          theme: "light",
          accentColor: "#676FFF",
        },
        solana: {
          rpcs: {
            [SOLANA_NETWORK]: {
              rpc: createSolanaRpc(SOLANA_RPC_URL),
              rpcSubscriptions: createSolanaRpcSubscriptions(SOLANA_WSS_URL),
            },
          },
        },
        embeddedWallets: {
          solana: {
            createOnLogin: "users-without-wallets",
          },
        },
      }}
    >
      <QueryClientProvider client={queryClient}>
        <AuthSync />
        <GoogleReCaptchaProvider
          reCaptchaKey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY as string}
          scriptProps={{
            async: false,
            defer: false,
            appendTo: "head",
            nonce: undefined,
          }}
        >
          {children}
        </GoogleReCaptchaProvider>
      </QueryClientProvider>
    </PrivyProvider>
  );
}
