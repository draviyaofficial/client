"use client";

import React, { useState } from "react";
import { Clock, Search, Filter, Loader2, AlertCircle } from "lucide-react";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { listIROsFn, IRO } from "@/services/iro/api";

export default function IPOsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [sortBy, setSortBy] = useState("daysLeft");

  const {
    data: irosResponse,
    isLoading,
    error,
  } = useQuery({
    queryKey: [
      "iros",
      selectedCategory !== "All Categories" ? selectedCategory : undefined,
    ],
    queryFn: async () => {
      return await listIROsFn({ status: "SCHEDULED" });
    },
  });

  const categories = [
    "All Categories",
    "Technology",
    "Health & Fitness",
    "Gaming",
    "Content Creation",
    "Music Production",
    "Digital Art",
  ];

  /* 
     Client-side filtering and processing since the API is simple for now.
     Real implementation would likely move this logic to the backend.
  */

  const iros = irosResponse?.data || [];

  const processedIROs =
    iros.map((iro: IRO) => {
      // Calculate progress, days left, etc.

      const endTime = new Date(iro.endTime);
      const now = new Date();
      const diffTime = endTime.getTime() - now.getTime();
      const daysLeft =
        diffTime > 0 ? Math.ceil(diffTime / (1000 * 60 * 60 * 24)) : 0;

      const hardCap = parseFloat(iro.hardCap);
      const totalRaised = parseFloat(iro.totalRaised || "0"); // Handle potentially missing totalRaised
      const progress = hardCap > 0 ? (totalRaised / hardCap) * 100 : 0;

      return {
        ...iro,
        daysLeft,
        progress: parseFloat(progress.toFixed(1)), // Round to 1 decimal
        raised: `$${totalRaised.toLocaleString()}`,
        valuation: "N/A", // Valuation typically implies market cap or FDV, could be calculated if needed: tokenPrice * totalSupply
        category: iro.token.user.creatorProfile?.sector || "Uncategorized",
        creatorName:
          iro.token.user.creatorProfile?.displayName ||
          iro.token.user.creatorProfile?.sector ||
          "Unknown Creator",
        avatar: iro.token.user.profilePicUrl,
      };
    }) || [];

  const filteredIPOs = processedIROs.filter((ipo) => {
    const matchesSearch =
      ipo.token.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ipo.creatorName.toLowerCase().includes(searchQuery.toLowerCase());

    // Exact category match or All
    const matchesCategory =
      selectedCategory === "All Categories" ||
      ipo.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const sortedIPOs = [...filteredIPOs].sort((a, b) => {
    switch (sortBy) {
      case "daysLeft":
        return a.daysLeft - b.daysLeft;
      default:
        return 0;
    }
  });

  return (
    <div className="space-y-8 bg-white rounded-xl p-10 min-h-[96.3vh]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-5xl font-semibold tracking-tight text-zinc-900">
            Initial Public Offerings
          </h1>
          <p className="text-zinc-400 text-lg mt-1">
            Invest in creator ventures before they go public.
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search IPOs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F2723B] focus:border-[#F2723B]"
          />
        </div>

        {/* Category Filter */}
        <div className="relative">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="appearance-none bg-white border border-zinc-200 rounded-lg px-4 py-2.5 pr-8 focus:ring-2 focus:ring-[#F2723B] focus:border-[#F2723B]"
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          <Filter className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
        </div>

        {/* Sort */}
        <div className="relative">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="appearance-none bg-white border border-zinc-200 rounded-lg px-4 py-2.5 pr-8 focus:ring-2 focus:ring-[#F2723B] focus:border-[#F2723B]"
          >
            <option value="daysLeft">Ending Soon</option>
            {/* Removed other options as we lack data to sort by them meaningfully yet */}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-zinc-400" />
        </div>
      ) : error ? (
        <div className="rounded-lg bg-red-50 p-4 border border-red-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <h5 className="font-medium text-red-900">Error</h5>
          </div>
          <p className="mt-1 text-sm text-red-800">
            Failed to load IROs. Please try again later.
          </p>
        </div>
      ) : sortedIPOs.length === 0 ? (
        <div className="text-center py-20 text-zinc-500">
          No IROs found matching your criteria.
        </div>
      ) : (
        /* IPO Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedIPOs.map((ipo) => (
            <div
              key={ipo.id}
              className="rounded-3xl border border-zinc-200 bg-white p-6"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="h-12 w-12 rounded-full bg-[#f9efe3] flex items-center justify-center text-zinc-900 font-semibold text-sm overflow-hidden">
                  {ipo.avatar ? (
                    <Image
                      src={ipo.avatar}
                      alt={ipo.creatorName}
                      width={48}
                      height={48}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    ipo.creatorName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-zinc-900">
                    {ipo.token.name}
                  </h3>
                  <p className="text-sm text-zinc-500">by {ipo.creatorName}</p>
                </div>
                <span className="rounded-full px-2.5 py-1 text-xs font-medium text-zinc-600 border border-zinc-300">
                  {ipo.category}
                </span>
              </div>

              <div className="mb-4 text-sm text-zinc-600">
                <p className="font-medium">
                  Ticker: <span className="uppercase">{ipo.token.symbol}</span>
                </p>
                <p className="mt-1">
                  Hard Cap: ${parseFloat(ipo.hardCap).toLocaleString()}
                </p>
              </div>

              {/* Progress Bar - Simplified since we lack 'raised' data */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="font-medium text-zinc-900">
                    Raised: {ipo.raised}
                  </span>
                  <span className="text-zinc-500">
                    Goal: ${parseFloat(ipo.hardCap).toLocaleString()}
                  </span>
                </div>
                <div className="w-full bg-zinc-200 rounded-full h-2">
                  <div
                    className="bg-[#F2723B] h-2 rounded-full transition-all duration-300"
                    style={{ width: `${ipo.progress}%` }}
                  />
                </div>
                <div className="flex justify-between mt-1">
                  <p className="text-xs text-zinc-500">
                    {ipo.progress}% funded
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-1 text-sm text-zinc-500">
                  <Clock className="h-4 w-4" />
                  <span>{ipo.daysLeft} days left</span>
                </div>
                <button
                  disabled
                  className="opacity-50 cursor-not-allowed rounded-lg bg-[#F2723B] px-4 py-2 text-sm font-medium text-white hover:bg-[#f2723be1] transition-colors"
                >
                  Coming Soon
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
