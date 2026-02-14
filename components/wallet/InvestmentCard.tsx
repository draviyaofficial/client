"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Info, Lock, Unlock, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { claimTokensFn, UserInvestment } from "@/services/iro/api";
import { usePrivy } from "@privy-io/react-auth";

interface InvestmentCardProps {
  investment: UserInvestment;
  onClaimSuccess: () => void;
}

export default function InvestmentCard({
  investment,
  onClaimSuccess,
}: InvestmentCardProps) {
  const { getAccessToken } = usePrivy();
  const [isClaiming, setIsClaiming] = useState(false);

  const claimable = parseFloat(investment.claimableAmount);
  const total = parseFloat(investment.totalAmount);
  const progressPercent = Math.min(
    100,
    Math.max(0, investment.vestingProgress * 100),
  );

  const handleClaim = async () => {
    const token = await getAccessToken();
    if (!token) return;

    try {
      setIsClaiming(true);
      await claimTokensFn(token, investment.iroId);
      toast.success(`Successfully claimed ${investment.token.symbol}`);
      onClaimSuccess();
    } catch (error: any) {
      console.error("Claim error:", error);
      toast.error(error.message || "Failed to claim tokens");
    } finally {
      setIsClaiming(false);
    }
  };

  /* Helper to format time left */
  const getTimeLeft = () => {
    if (investment.isFullyVested) return "Vesting Complete";

    const now = Date.now();
    const end = investment.vestingEndTime;
    const diff = end - now;

    if (diff <= 0) return "Vesting Complete";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days} days left`;
    return `${hours} hours left`;
  };

  return (
    <div className="bg-white rounded-xl border border-zinc-200 p-6 flex flex-col gap-6">
      {/* Header: Token Info & Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center overflow-hidden">
            {investment.token.logoUrl ? (
              <Image
                src={investment.token.logoUrl}
                alt={investment.token.name}
                width={48}
                height={48}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-xl font-bold text-zinc-400">
                {investment.token.symbol[0]}
              </span>
            )}
          </div>
          <div>
            <h3 className="font-semibold text-lg text-zinc-900">
              {investment.token.name}
            </h3>
            <p className="text-sm text-zinc-500">{investment.token.symbol}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-zinc-500">
            {getTimeLeft()}
          </span>
          <div className="group relative">
            <Info className="w-5 h-5 text-zinc-400 hover:text-zinc-600 cursor-help" />
            <div className="absolute right-0 bottom-full mb-2 w-64 p-3 bg-zinc-900 text-white text-xs rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
              <p className="font-semibold mb-1">Vesting Schedule</p>
              <p>
                Tokens maximize long-term alignment. Your tokens unlock over
                time based on the IRO schedule.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-3 bg-zinc-50 rounded-lg">
          <p className="text-xs text-zinc-500 mb-1">Total Allocation</p>
          <p className="font-semibold text-zinc-900">
            {parseFloat(investment.totalAmount).toLocaleString()}
          </p>
        </div>
        <div className="p-3 bg-zinc-50 rounded-lg">
          <p className="text-xs text-zinc-500 mb-1">Unlocked</p>
          <p className="font-semibold text-zinc-900">
            {parseFloat(investment.unlockedAmount).toLocaleString()}
          </p>
        </div>
        <div className="p-3 bg-zinc-50 rounded-lg">
          <p className="text-xs text-zinc-500 mb-1">Claimed</p>
          <p className="font-semibold text-zinc-900">
            {parseFloat(investment.claimedAmount).toLocaleString()}
          </p>
        </div>
        <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-100">
          <p className="text-xs text-indigo-600 mb-1">Claimable</p>
          <p className="font-semibold text-indigo-700">
            {claimable.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="pt-4 border-t border-zinc-100 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-zinc-500">
          {investment.isFullyVested ? (
            <span className="flex items-center gap-1.5 text-green-600">
              <CheckCircle className="w-4 h-4" />
              Fully Vested
            </span>
          ) : (
            <span className="flex items-center gap-1.5">
              <Lock className="w-4 h-4" />
              Locked: {parseFloat(investment.lockedAmount).toLocaleString()}
            </span>
          )}
        </div>

        <button
          onClick={handleClaim}
          disabled={claimable <= 0 || isClaiming}
          className={`
                px-6 py-2 rounded-lg font-medium transition-all flex items-center gap-2
                ${
                  claimable > 0
                    ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:shadow-lg"
                    : "bg-zinc-100 text-zinc-400 cursor-not-allowed"
                }
            `}
        >
          {isClaiming ? (
            <>
              <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              Claiming...
            </>
          ) : (
            <>
              <Unlock className="w-4 h-4" />
              Claim Tokens
            </>
          )}
        </button>
      </div>
    </div>
  );
}
