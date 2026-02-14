"use client";

import React, { useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useQuery } from "@tanstack/react-query";
import {
  Wallet,
  Copy,
  Check,
  RefreshCw,
  Send,
  ArrowUpRight,
  Activity,
  ArrowDownLeft,
} from "lucide-react";
import { toast } from "sonner";
import { PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { useUser } from "@/services/auth/model/hooks/useUser";
import { connection } from "@/services/solana/connection";
import InvestmentCard from "@/components/wallet/InvestmentCard";
import { getUserInvestmentsFn } from "@/services/iro/api";

const isProduction = process.env.NODE_ENV === "production";

interface Transaction {
  signature: string;
  slot: number;
  blockTime?: number | null;
  err?: any;
  amount?: number;
}

export default function WalletPage() {
  const { data: user, isLoading: isUserLoading } = useUser();
  const { user: privyUser, getAccessToken } = usePrivy();
  const [copied, setCopied] = useState(false);

  // Get wallet address from db user or privy user
  const walletAddress = user?.walletAddress || privyUser?.wallet?.address;

  // Fetch Balance
  const {
    data: balance,
    isLoading: isLoadingBalance,
    refetch: refetchBalance,
  } = useQuery({
    queryKey: ["wallet-balance", walletAddress],
    queryFn: async () => {
      if (!walletAddress) return null;
      try {
        const publicKey = new PublicKey(walletAddress);
        const bal = await connection.getBalance(publicKey);
        return bal / LAMPORTS_PER_SOL;
      } catch (error) {
        console.error("Error fetching balance:", error);
        throw error;
      }
    },
    enabled: !!walletAddress,
    staleTime: 1000 * 30, // 30 seconds
    retry: (failureCount, error: any) => {
      if (error?.message?.includes("429")) return false;
      return failureCount < 3;
    },
  });

  // Fetch Transactions
  const {
    data: txData,
    isLoading: isLoadingTx,
    refetch: refetchTx,
  } = useQuery({
    queryKey: ["wallet-transactions", walletAddress],
    queryFn: async () => {
      if (!walletAddress) return { transactions: [], income: 0, spending: 0 };

      try {
        const publicKey = new PublicKey(walletAddress);

        // Fetch last 20 signatures
        const signatures = await connection.getSignaturesForAddress(publicKey, {
          limit: 20,
        });

        // Get parsed details to calculate amounts
        const signatureList = signatures.map((s) => s.signature);
        if (signatureList.length === 0) {
          return { transactions: [], income: 0, spending: 0 };
        }

        const txDetails = await connection.getParsedTransactions(
          signatureList,
          {
            maxSupportedTransactionVersion: 0,
          },
        );

        let totalIncome = 0;
        let totalSpending = 0;

        const processedTxs = signatures.map((sig, index) => {
          const detail = txDetails[index];
          let amount = 0;

          if (detail && detail.meta && detail.transaction) {
            // Find account index
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const accountKeys = detail.transaction.message.accountKeys;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const accountIndex = accountKeys.findIndex((account: any) => {
              const key = account.pubkey
                ? account.pubkey.toString()
                : account.toString();
              return key === walletAddress;
            });

            if (accountIndex !== -1) {
              const preBalance = detail.meta.preBalances[accountIndex] || 0;
              const postBalance = detail.meta.postBalances[accountIndex] || 0;
              const diff = postBalance - preBalance;

              amount = diff / LAMPORTS_PER_SOL;

              if (diff > 0) {
                totalIncome += diff;
              } else if (diff < 0) {
                totalSpending += Math.abs(diff);
              }
            }
          }

          return {
            signature: sig.signature,
            slot: sig.slot,
            blockTime: sig.blockTime,
            err: sig.err,
            amount,
          };
        });

        return {
          transactions: processedTxs,
          income: totalIncome / LAMPORTS_PER_SOL,
          spending: totalSpending / LAMPORTS_PER_SOL,
        };
      } catch (error) {
        console.error("Error fetching transactions:", error);
        throw error;
      }
    },
    enabled: !!walletAddress,
    staleTime: 1000 * 60 * 2, // 2 minutes
    retry: (failureCount, error: any) => {
      if (error?.message?.includes("429")) return false;
      return failureCount < 3;
    },
  });

  const transactions = txData?.transactions || [];
  const income = txData?.income || 0;
  const spending = txData?.spending || 0;

  const handleCopy = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      toast.success("Wallet address copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Fetch Investments
  const {
    data: investments,
    isLoading: isLoadingInvestments,
    refetch: refetchInvestments,
  } = useQuery({
    queryKey: ["user-investments", walletAddress],
    queryFn: async () => {
      const token = await getAccessToken();
      if (!token) return [];
      return await getUserInvestmentsFn(token);
    },
    enabled: !!walletAddress, // and token is implicit
  });

  const handleRefresh = async () => {
    await Promise.all([refetchBalance(), refetchTx(), refetchInvestments()]);
    toast.success("Wallet refreshed");
  };

  if (isUserLoading) {
    return (
      <div className="bg-white rounded-xl p-10 flex items-center justify-center min-h-[500px]">
        <div className="animate-pulse text-zinc-500">
          Loading wallet info...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 bg-white rounded-xl p-10 min-h-[calc(100vh-2.5rem)]">
      {/* Header */}
      <div>
        <h1 className="text-5xl font-semibold tracking-tight text-zinc-900">
          Wallet
        </h1>
        <p className="text-zinc-400 mt-1 text-lg">
          Manage your assets and view your investment portfolio.
        </p>
      </div>

      {/* Wallet Card */}
      <div className="rounded-2xl bg-linear-to-br from-[#1a1c2e] to-[#2d3250] p-8 text-white shadow-xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <p className="text-zinc-400 font-medium mb-1">Total Balance</p>
            <div className="flex items-baseline gap-2">
              <h2 className="text-4xl font-bold">
                {isLoadingBalance ? (
                  <span className="animate-pulse opacity-50">Loading...</span>
                ) : (
                  `${
                    balance !== undefined && balance !== null
                      ? balance.toLocaleString(undefined, {
                          maximumFractionDigits: 4,
                        })
                      : "0"
                  } SOL`
                )}
              </h2>
            </div>
          </div>

          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors backdrop-blur-sm">
              <Send className="w-4 h-4" />
              <span>Send</span>
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-[#F2723B] hover:bg-[#d65d2b] rounded-lg transition-colors shadow-lg">
              <ArrowDownLeft className="w-4 h-4" />
              <span>Receive</span>
            </button>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-lg">
              <Wallet className="w-5 h-5 text-white/80" />
            </div>
            <div>
              <p className="text-xs text-zinc-400">Wallet Address</p>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm">
                  {walletAddress
                    ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
                    : "No wallet connected"}
                </span>
                {walletAddress && (
                  <button
                    onClick={handleCopy}
                    className="text-white/60 hover:text-white transition-colors"
                  >
                    {copied ? (
                      <Check className="w-3 h-3" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={handleRefresh}
            disabled={isLoadingBalance || isLoadingTx || isLoadingInvestments}
            className={`p-2 rounded-full hover:bg-white/10 transition-colors ${
              isLoadingBalance || isLoadingTx || isLoadingInvestments
                ? "animate-spin"
                : ""
            }`}
          >
            <RefreshCw className="w-5 h-5 text-white/60" />
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-xl border border-zinc-200 bg-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-green-50 text-green-600">
              <ArrowDownLeft className="w-5 h-5" />
            </div>
            <span className="font-medium text-zinc-900">Income</span>
          </div>
          <p className="text-2xl font-semibold text-zinc-900">
            {isLoadingTx
              ? "..."
              : `+${income.toLocaleString(undefined, { maximumFractionDigits: 4 })} SOL`}
          </p>
          <p className="text-xs text-zinc-500 mt-1">
            Total received (Last 20 txs)
          </p>
        </div>

        <div className="p-6 rounded-xl border border-zinc-200 bg-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-red-50 text-red-600">
              <ArrowUpRight className="w-5 h-5" />
            </div>
            <span className="font-medium text-zinc-900">Spending</span>
          </div>
          <p className="text-2xl font-semibold text-zinc-900">
            {isLoadingTx
              ? "..."
              : `-${spending.toLocaleString(undefined, { maximumFractionDigits: 4 })} SOL`}
          </p>
          <p className="text-xs text-zinc-500 mt-1">Total sent (Last 20 txs)</p>
        </div>

        <div className="p-6 rounded-xl border border-zinc-200 bg-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <Activity className="w-5 h-5" />
            </div>
            <span className="font-medium text-zinc-900">Activity</span>
          </div>
          <p className="text-2xl font-semibold text-zinc-900">
            {transactions.length}
          </p>
          <p className="text-xs text-zinc-500 mt-1">Total transactions</p>
        </div>
      </div>

      {/* My Investments Section */}
      <div>
        <h2 className="text-xl font-semibold text-zinc-900 mb-4">
          My Investments & Vesting
        </h2>

        {isLoadingInvestments ? (
          <div className="grid grid-cols-1 gap-4">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="h-64 bg-zinc-50 rounded-xl animate-pulse border border-zinc-200"
              />
            ))}
          </div>
        ) : investments && investments.length > 0 ? (
          <div className="flex flex-col gap-6">
            {investments.map((inv) => (
              <InvestmentCard
                key={inv.id}
                investment={inv}
                onClaimSuccess={refetchInvestments}
              />
            ))}
          </div>
        ) : (
          <div className="p-12 text-center border border-zinc-200 rounded-xl bg-zinc-50">
            <p className="text-zinc-500 text-lg">
              You haven&apos;t participated in any IROs yet.
            </p>
            <p className="text-sm text-zinc-400 mt-2">
              Check out the dashboard to find new opportunities.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
