import React from "react";
import {
  ArrowUpRight,
  ArrowDownLeft,
  Check,
  Clock,
  ExternalLink,
} from "lucide-react";
import { usePrivy } from "@privy-io/react-auth";
import { useUser } from "@/services/auth/model/hooks/useUser";
import { connection } from "@/services/solana/connection";
import { useQuery } from "@tanstack/react-query";
import { PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";

const isProduction = process.env.NODE_ENV === "production";

export function ActivityFeed() {
  const { data: user } = useUser();
  const { user: privyUser } = usePrivy();

  // Get wallet address from db user or privy user
  const walletAddress = user?.walletAddress || privyUser?.wallet?.address;

  const { data: transactions, isLoading } = useQuery({
    queryKey: ["dashboard-activity", walletAddress],
    queryFn: async () => {
      if (!walletAddress) return [];

      try {
        const publicKey = new PublicKey(walletAddress);
        // Fetch last 5 signatures for dashboard
        const signatures = await connection.getSignaturesForAddress(publicKey, {
          limit: 5,
        });

        const signatureList = signatures.map((s) => s.signature);
        if (signatureList.length === 0) return [];

        const txDetails = await connection.getParsedTransactions(
          signatureList,
          {
            maxSupportedTransactionVersion: 0,
          },
        );

        return signatures.map((sig, index) => {
          const detail = txDetails[index];
          let amount = 0;
          let type = "unknown";

          if (detail && detail.meta && detail.transaction) {
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
              type = diff > 0 ? "received" : "sent";
            }
          }

          return {
            signature: sig.signature,
            blockTime: sig.blockTime,
            err: sig.err,
            amount,
            type,
          };
        });
      } catch (error) {
        console.error("Error fetching activity:", error);
        return [];
      }
    },
    enabled: !!walletAddress,
    staleTime: 1000 * 60,
  });

  return (
    <div>
      <div className="rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-zinc-100 bg-zinc-50/50 px-6 py-4">
          <h3 className="font-semibold text-zinc-900">Recent Activity</h3>
        </div>

        <div className="divide-y divide-zinc-100">
          {isLoading ? (
            <div className="p-8 text-center text-zinc-500 animate-pulse">
              Loading activity...
            </div>
          ) : transactions && transactions.length > 0 ? (
            transactions.map((activity) => (
              <div
                key={activity.signature}
                className="p-6 hover:bg-zinc-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                      activity.err
                        ? "bg-red-50 text-red-600"
                        : activity.type === "received"
                          ? "bg-green-50 text-green-600"
                          : "bg-blue-50 text-blue-600"
                    }`}
                  >
                    {activity.err ? (
                      <ArrowUpRight className="h-5 w-5" />
                    ) : activity.type === "received" ? (
                      <ArrowDownLeft className="h-5 w-5" />
                    ) : (
                      <ArrowUpRight className="h-5 w-5" />
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-zinc-900">
                        {activity.err
                          ? "Failed Transaction"
                          : activity.type === "received"
                            ? "Received SOL"
                            : "Sent SOL"}
                      </p>
                      <span className="text-xs text-zinc-400 font-mono">
                        {activity.signature.slice(0, 4)}...
                        {activity.signature.slice(-4)}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-1">
                      <p
                        className={`text-sm ${
                          activity.type === "received"
                            ? "text-green-600"
                            : "text-zinc-500"
                        }`}
                      >
                        {activity.type === "received" ? "+" : ""}
                        {Math.abs(activity.amount).toLocaleString(undefined, {
                          maximumFractionDigits: 4,
                        })}{" "}
                        SOL
                      </p>
                      <div className="flex items-center gap-1 text-xs text-zinc-400">
                        <Clock className="h-3 w-3" />
                        <span>
                          {activity.blockTime
                            ? new Date(
                                activity.blockTime * 1000,
                              ).toLocaleString()
                            : "Unknown date"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <a
                    href={`https://explorer.solana.com/tx/${activity.signature}?cluster=${
                      isProduction ? "mainnet-beta" : "devnet"
                    }`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-zinc-400 hover:text-zinc-600 transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-zinc-500">
              No recent activity found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
