"use client";

import React, { useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useQuery } from "@tanstack/react-query";
import { getUserPortfolioFn } from "@/services/user/api";
import { Wallet, TrendingUp, PieChart, Layers, Search } from "lucide-react";
import NextImage from "next/image";

export default function PortfolioPage() {
  const { getAccessToken } = usePrivy();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: portfolioResponse, isLoading } = useQuery({
    queryKey: ["portfolio"],
    queryFn: async () => {
      const token = await getAccessToken();
      if (!token) return [];
      return getUserPortfolioFn(token);
    },
    enabled: true,
  });

  const portfolio = portfolioResponse || [];

  const totalValue = portfolio.reduce(
    (sum, item) => sum + (item.currentValue || 0),
    0,
  );

  const totalTokens = portfolio.length;

  // Find best performer (for now, just highest value since we lack PnL data)
  const bestPerformer =
    portfolio.length > 0
      ? portfolio.reduce((max, item) =>
          item.currentValue > max.currentValue ? item : max,
        )
      : null;

  // Filter holdings
  const filteredPortfolio = portfolio.filter((item) => {
    const name =
      item.token.user.creatorProfile?.displayName || item.token.name || "";
    const symbol = item.token.symbol || "";
    return (
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      symbol.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="space-y-8 bg-white rounded-xl p-10 min-h-[calc(100vh-2.5rem)]">
      {/* Header */}
      <div>
        <h1 className="text-5xl font-semibold tracking-tight text-zinc-900">
          Portfolio
        </h1>
        <p className="text-zinc-400 mt-1 text-lg">
          Track your creator tokens and investment performance.
        </p>
      </div>

      {/* Hero Card - Portfolio Value */}
      <div className="rounded-2xl bg-linear-to-br from-[#1a1c2e] to-[#2d3250] p-8 text-white shadow-xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <p className="text-zinc-400 font-medium mb-1">
              Total Portfolio Value
            </p>
            <div className="flex items-baseline gap-2">
              <h2 className="text-4xl font-bold">
                {isLoading ? (
                  <span className="animate-pulse opacity-50">Loading...</span>
                ) : (
                  `$${totalValue.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}`
                )}
              </h2>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm border border-white/5">
              <PieChart className="w-6 h-6 text-white/80" />
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-white/10 flex items-center gap-6">
          <div className="flex items-center gap-2 text-sm text-zinc-400">
            <Layers className="w-4 h-4" />
            <span>{totalTokens} Assets</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-zinc-400">
            <Wallet className="w-4 h-4" />
            <span>Held in Draviya Custody</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Stat 1: Total Assets */}
        <div className="p-6 rounded-xl border border-zinc-200 bg-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <Layers className="w-5 h-5" />
            </div>
            <span className="font-medium text-zinc-900">Total Holdings</span>
          </div>
          <p className="text-2xl font-semibold text-zinc-900">{totalTokens}</p>
          <p className="text-xs text-zinc-500 mt-1">Unique tokens owned</p>
        </div>

        {/* Stat 2: Best Performer */}
        <div className="p-6 rounded-xl border border-zinc-200 bg-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-green-50 text-green-600">
              <TrendingUp className="w-5 h-5" />
            </div>
            <span className="font-medium text-zinc-900">Top Asset</span>
          </div>
          <p className="text-2xl font-semibold text-zinc-900 truncate">
            {bestPerformer?.token.symbol || "--"}
          </p>
          <p className="text-xs text-zinc-500 mt-1 truncate">
            {bestPerformer?.token.user.creatorProfile?.displayName ||
              "No assets"}
          </p>
        </div>

        {/* Stat 3: Avg Allocation */}
        <div className="p-6 rounded-xl border border-zinc-200 bg-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
              <PieChart className="w-5 h-5" />
            </div>
            <span className="font-medium text-zinc-900">Avg. Position</span>
          </div>
          <p className="text-2xl font-semibold text-zinc-900">
            {isLoading
              ? "..."
              : totalTokens > 0
                ? `$${(totalValue / totalTokens).toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                : "$0"}
          </p>
          <p className="text-xs text-zinc-500 mt-1">Per value</p>
        </div>
      </div>

      {/* Holdings List */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-zinc-900">Your Holdings</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 overflow-hidden bg-white">
          {isLoading ? (
            <div className="p-8 text-center text-zinc-500 animate-pulse">
              Loading holdings...
            </div>
          ) : filteredPortfolio.length > 0 ? (
            <div className="divide-y divide-zinc-100">
              {filteredPortfolio.map((item) => (
                <div
                  key={item.id}
                  className="p-4 hover:bg-zinc-50 transition-colors flex items-center justify-between group"
                >
                  <div className="flex items-center gap-4">
                    <div className="relative h-10 w-10 shrink-0">
                      <NextImage
                        src={
                          item.token.user.profilePicUrl ||
                          `https://placehold.co/40x40?text=${item.token.symbol.slice(
                            0,
                            2,
                          )}`
                        }
                        alt={item.token.symbol}
                        fill
                        className="rounded-full object-cover"
                      />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-zinc-900">
                        {item.token.user.creatorProfile?.displayName ||
                          "Unknown Creator"}
                      </div>
                      <div className="text-xs text-zinc-500 flex items-center gap-1.5">
                        <span className="font-medium text-zinc-600">
                          {item.token.symbol}
                        </span>
                        <span>•</span>
                        <span>{item.token.name}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-8">
                    <div className="text-right">
                      <div className="text-sm font-medium text-zinc-900">
                        {item.totalAmount.toLocaleString()}
                      </div>
                      <div className="text-xs text-zinc-500">Tokens Owned</div>
                    </div>

                    <div className="text-right w-24">
                      <div className="text-sm font-medium text-zinc-900">
                        ${item.currentValue.toLocaleString()}
                      </div>
                      <div className="text-xs text-zinc-500">
                        @ ${item.currentPrice.toFixed(4)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-zinc-100 mb-4">
                <Layers className="w-6 h-6 text-zinc-400" />
              </div>
              <h3 className="text-zinc-900 font-medium mb-1">
                No holdings found
              </h3>
              <p className="text-zinc-500 text-sm">
                Participate in an IRO to start building your portfolio.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
