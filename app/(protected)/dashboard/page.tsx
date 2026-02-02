"use client";

import React from "react";
import { CreatorCard } from "@/components/dashboard/CreatorCard";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import {
  TrendingUp,
  Users,
  Activity,
  User,
  PieChart,
  Layers,
  Wallet,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { listIROsFn } from "@/services/iro/api";
import { getUserPortfolioFn } from "@/services/user/api";
import { usePrivy } from "@privy-io/react-auth";
import Link from "next/link";

export default function DashboardPage() {
  const { getAccessToken } = usePrivy();

  const { data: iros, isLoading: isLoadingIROs } = useQuery({
    queryKey: ["active-iros"],
    queryFn: async () => {
      const data = await listIROsFn({ status: "LIVE", limit: 3 });
      return data;
    },
    staleTime: 1000 * 60, // 1 minute
  });

  const { data: portfolio, isLoading: isLoadingPortfolio } = useQuery({
    queryKey: ["portfolio"],
    queryFn: async () => {
      const token = await getAccessToken();
      if (!token) return [];
      return getUserPortfolioFn(token);
    },
    staleTime: 1000 * 30,
    enabled: true,
  });

  const totalValue =
    portfolio?.reduce((acc, item) => acc + (item.currentValue || 0), 0) || 0;
  const totalTokens = portfolio?.length || 0;

  return (
    <div className="space-y-12 bg-white rounded-xl p-10 min-h-[calc(100vh-2.5rem)]">
      {/* Header */}
      <div>
        <h1 className="text-5xl font-semibold tracking-tight text-zinc-900">
          Dashboard
        </h1>
        <p className="text-zinc-400 mt-1 text-lg">
          Your creator investments, all in one place.
        </p>
      </div>

      {/* Hero Section - Portfolio Value & Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hero Card */}
        <div className="lg:col-span-2 rounded-2xl bg-linear-to-br from-[#1a1c2e] to-[#2d3250] p-8 text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 rounded-lg bg-white/10 backdrop-blur-md">
                  <Wallet className="w-5 h-5 text-indigo-300" />
                </div>
                <p className="text-indigo-200 font-medium">Portfolio Value</p>
              </div>
              <h2 className="text-5xl font-bold mt-2">
                {isLoadingPortfolio ? (
                  <span className="animate-pulse opacity-50">...</span>
                ) : (
                  `$${totalValue.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}`
                )}
              </h2>
            </div>

            <div className="mt-8 flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-sm text-indigo-100">Live Updates</span>
              </div>
              <Link
                href="/portfolio"
                className="text-sm text-indigo-300 hover:text-white transition-colors flex items-center gap-1"
              >
                View Portfolio <TrendingUp className="w-3 h-3" />
              </Link>
            </div>
          </div>
          {/* Decorative gradients */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 rounded-full blur-2xl -ml-12 -mb-12 pointer-events-none" />
        </div>

        {/* Quick Stats Column */}
        <div className="space-y-6">
          <div className="p-6 rounded-2xl border border-zinc-200 bg-zinc-50/50 flex flex-col justify-center h-[calc(50%-12px)]">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                <Layers className="w-4 h-4" />
              </div>
              <span className="font-medium text-zinc-600">Total Tokens</span>
            </div>
            <p className="text-3xl font-semibold text-zinc-900">
              {totalTokens}
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-zinc-200 bg-zinc-50/50 flex flex-col justify-center h-[calc(50%-12px)]">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-green-100 text-green-600">
                <Activity className="w-4 h-4" />
              </div>
              <span className="font-medium text-zinc-600">Active IROs</span>
            </div>
            <p className="text-3xl font-semibold text-zinc-900">
              {iros?.data?.length || 0}
            </p>
          </div>
        </div>
      </div>

      {/* Featured IROs Section */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-semibold text-zinc-900">
              Featured IROs
            </h2>
            <p className="text-zinc-500 mt-1">
              Discover opportunities before they go public.
            </p>
          </div>
          <Link
            href="/iros"
            className="text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
          >
            View All
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoadingIROs ? (
            <div className="col-span-full py-20 text-center text-zinc-500 bg-zinc-50 rounded-2xl border border-zinc-100 border-dashed">
              Loading active IROs...
            </div>
          ) : iros?.data && iros.data.length > 0 ? (
            iros.data.map((iro) => (
              <CreatorCard
                key={iro.id}
                id={iro.id}
                creator={
                  iro.token.user.creatorProfile?.displayName || "Creator"
                }
                name={iro.token.name}
                description={iro.token.description || "No description"}
                progress={
                  parseFloat(iro.hardCap) > 0
                    ? (parseFloat(iro.totalRaised) / parseFloat(iro.hardCap)) *
                      100
                    : 0
                }
                target={`${parseFloat(iro.hardCap).toLocaleString()} SOL`}
                raised={`${parseFloat(iro.totalRaised).toLocaleString()} SOL`}
                daysLeft={Math.max(
                  0,
                  Math.ceil(
                    (new Date(iro.endTime).getTime() - Date.now()) /
                      (1000 * 60 * 60 * 24),
                  ),
                )}
                category={iro.token.user.creatorProfile?.sector || "General"}
                avatar={
                  iro.token.user.profilePicUrl ||
                  `https://placehold.co/40x40?text=${iro.token.symbol.slice(
                    0,
                    2,
                  )}`
                }
              />
            ))
          ) : (
            <div className="col-span-full py-20 text-center text-zinc-500 bg-zinc-50 rounded-2xl border border-zinc-100 border-dashed">
              No active IROs found. Check back later!
            </div>
          )}
        </div>
      </div>

      {/* Activity Feed */}
      <div>
        <h2 className="text-2xl font-semibold text-zinc-900 mb-6">
          Recent Activity
        </h2>
        <ActivityFeed />
      </div>
    </div>
  );
}
