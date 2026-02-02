import { Connection } from "@solana/web3.js";

const isProduction = process.env.NODE_ENV === "production";
const SOLANA_RPC_URL =
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL ||
  (isProduction
    ? "https://api.mainnet-beta.solana.com"
    : "https://api.devnet.solana.com");

export const connection = new Connection(SOLANA_RPC_URL, "confirmed");
