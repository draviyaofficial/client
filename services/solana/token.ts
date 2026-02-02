import { Connection, PublicKey } from "@solana/web3.js";
import { connection } from "./connection";

export interface TokenAnalytics {
  supply: number;
  decimals: number;
  holders: number;
  topHolders: { address: string; amount: number; percentage: number }[];
}

export const getTokenAnalytics = async (
  mintAddress: string,
): Promise<TokenAnalytics> => {
  try {
    const mintPubkey = new PublicKey(mintAddress);

    // Get Token Supply
    const supplyInfo = await connection.getTokenSupply(mintPubkey);
    const supply = supplyInfo.value.uiAmount || 0;
    const decimals = supplyInfo.value.decimals;

    // Get Largest Accounts (Top Holders)
    // Note: getTokenLargestAccounts returns the top 20 accounts by default
    const largestAccounts =
      await connection.getTokenLargestAccounts(mintPubkey);

    // Approximate holder count is hard to get efficiently on Solana without an indexer (like Helius/Shyft).
    // For now, we'll return the count of largest accounts as a baseline or just "N/A" if checking all is too heavy.
    // Actually, we can't easily get total holder count via standard RPC without iterating.
    // We will just label it as "Top Holders" for now in the UI or leave 'holders' as approximation.

    const topHolders = largestAccounts.value.map((account) => {
      const amount = account.uiAmount || 0;
      return {
        address: account.address.toString(),
        amount: amount,
        percentage: (amount / supply) * 100,
      };
    });

    return {
      supply,
      decimals,
      holders: largestAccounts.value.length, // Just returning count of top accounts fetched
      topHolders,
    };
  } catch (error) {
    console.error("Failed to fetch token analytics:", error);
    // Propagate the original error message so we can detect 429s
    throw error instanceof Error
      ? error
      : new Error("Failed to fetch on-chain data");
  }
};
