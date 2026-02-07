"use client";

import React, { useState } from "react";
import {
  Clock,
  Search,
  Filter,
  Loader2,
  AlertCircle,
  Activity,
  ArrowRight,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { listIROsFn, IRO } from "@/services/iro/api";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function IROsPage() {
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
      // Fetch ALL IROs (Scheduled, Live, Completed, etc.)
      return await listIROsFn({});
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
  let totalRaisedSol = 0;

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

      totalRaisedSol += totalRaised;

      const progress = hardCap > 0 ? (totalRaised / hardCap) * 100 : 0;

      return {
        ...iro,
        daysLeft,
        progress: parseFloat(progress.toFixed(1)), // Round to 1 decimal
        raised: `${totalRaised.toLocaleString()} SOL`,
        valuation: "N/A", // Valuation typically implies market cap or FDV, could be calculated if needed: tokenPrice * totalSupply
        category: iro.token.user.creatorProfile?.sector || "Uncategorized",
        creatorName:
          iro.token.user.creatorProfile?.displayName ||
          iro.token.user.creatorProfile?.sector ||
          "Unknown Creator",
        avatar: iro.token.user.profilePicUrl,
      };
    }) || [];

  const filteredIROs = processedIROs.filter((iro) => {
    const matchesSearch =
      iro.token.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      iro.creatorName.toLowerCase().includes(searchQuery.toLowerCase());

    // Exact category match or All
    const matchesCategory =
      selectedCategory === "All Categories" ||
      iro.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const sortedIROs = [...filteredIROs].sort((a, b) => {
    switch (sortBy) {
      case "daysLeft":
        return a.daysLeft - b.daysLeft;
      default:
        return 0;
    }
  });

  // Helper function for status badge style
  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case "LIVE":
        return "bg-orange-50 text-orange-600 border-orange-100";
      case "SCHEDULED":
        return "bg-blue-50 text-blue-600 border-blue-100";
      case "COMPLETED":
        return "bg-green-50 text-green-600 border-green-100";
      case "FAILED":
        return "bg-red-50 text-red-600 border-red-100";
      default:
        return "bg-zinc-50 text-zinc-600 border-zinc-100";
    }
  };

  return (
    <div className="space-y-10 bg-white rounded-xl p-10 min-h-[calc(100vh-2.5rem)]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-5xl font-semibold tracking-tight text-zinc-900">
            Initial Return Offerings
          </h1>
          <p className="text-zinc-400 text-lg mt-2 font-light">
            Invest in creator ventures before they go public.
          </p>
        </div>
      </div>

      {/* Stats Section - New */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-8 rounded-2xl bg-linear-to-br from-[#1a1c2e] to-[#2d3250] text-white shadow-xl relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 px-5 rounded-xl bg-white/10 text-white backdrop-blur-md border border-white/10">
                <code className="text-xl font-bold">$</code>
              </div>
              <span className="font-medium text-indigo-100/80 text-lg">
                Total Funds Raised
              </span>
            </div>
            <p className="text-4xl font-bold text-white tracking-tight">
              {totalRaisedSol.toLocaleString(undefined, {
                maximumFractionDigits: 2,
              })}{" "}
              <span className="text-2xl text-indigo-300/80 font-normal">
                SOL
              </span>
            </p>
            <p className="text-sm text-indigo-200/60 mt-2">
              Across all active IROs
            </p>
          </div>
          {/* Decorative gradients */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl -mr-12 -mt-12 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl -ml-8 -mb-8 pointer-events-none" />
        </div>

        <Card className="border-zinc-100 shadow-xs hover:shadow-md transition-shadow duration-300">
          <CardContent className="p-8 flex flex-col justify-center h-full">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600">
                <Activity className="w-6 h-6" />
              </div>
              <span className="font-medium text-zinc-600 text-lg">
                Active IROs
              </span>
            </div>
            <p className="text-4xl font-bold text-zinc-900">{iros.length}</p>
            <p className="text-sm text-zinc-400 mt-2">Currently live</p>
          </CardContent>
        </Card>

        <Card className="border-zinc-100 shadow-xs hover:shadow-md transition-shadow duration-300">
          <CardContent className="p-8 flex flex-col justify-center h-full">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 rounded-xl bg-blue-50 text-blue-600">
                <Filter className="w-6 h-6" />
              </div>
              <span className="font-medium text-zinc-600 text-lg">
                Categories
              </span>
            </div>
            <p className="text-4xl font-bold text-zinc-900">
              {
                new Set(iros.map((i) => i.token.user.creatorProfile?.sector))
                  .size
              }
            </p>
            <p className="text-sm text-zinc-400 mt-2">Diverse sectors</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 pt-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <Input
            type="text"
            placeholder="Search projects or creators..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12 text-base bg-zinc-50/50 border-zinc-200 focus:bg-white transition-colors"
          />
        </div>

        {/* Category Filter */}
        <div className="relative min-w-[200px]">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full h-12 appearance-none bg-zinc-50/50 border border-zinc-200 rounded-md px-4 pr-10 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white transition-colors outline-hidden"
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          <Filter className="absolute right-3.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
        </div>

        {/* Sort */}
        <div className="relative min-w-[180px]">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full h-12 appearance-none bg-zinc-50/50 border border-zinc-200 rounded-md px-4 pr-10 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white transition-colors outline-hidden"
          >
            <option value="daysLeft">Ending Soon</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-32">
          <Loader2 className="h-10 w-10 animate-spin text-[#F2723B]" />
        </div>
      ) : error ? (
        <div className="rounded-xl bg-red-50 p-6 border border-red-100 flex items-center justify-center text-center">
          <div className="space-y-2">
            <AlertCircle className="h-8 w-8 text-red-600 mx-auto" />
            <h5 className="font-medium text-red-900 text-lg">
              Failed to load content
            </h5>
            <p className="text-red-800">
              Please check your connection and try again.
            </p>
          </div>
        </div>
      ) : sortedIROs.length === 0 ? (
        <div className="text-center py-32">
          <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-zinc-300" />
          </div>
          <p className="text-zinc-500 text-lg">
            No active IROs found matching your criteria.
          </p>
        </div>
      ) : (
        /* IRO Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-10">
          {sortedIROs.map((iro) => (
            <Card
              key={iro.id}
              className="group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-zinc-200/60 overflow-hidden flex flex-col"
            >
              <CardHeader className="p-6 border-b border-zinc-50 bg-zinc-50/30">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-full bg-indigo-50 flex items-center justify-center text-zinc-900 font-bold text-lg overflow-hidden shrink-0 border-2 border-white shadow-sm">
                    {iro.avatar ? (
                      <Image
                        src={iro.avatar}
                        alt={iro.creatorName}
                        width={56}
                        height={56}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      iro.creatorName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-zinc-900 text-lg truncate group-hover:text-[#F2723B] transition-colors">
                      {iro.token.name}
                    </h3>
                    <p className="text-sm text-zinc-500 truncate flex items-center gap-1">
                      by{" "}
                      <span className="font-medium text-zinc-700">
                        {iro.creatorName}
                      </span>
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <div className="px-2.5 py-1 rounded-md bg-zinc-100 text-zinc-600 text-xs font-semibold uppercase tracking-wider">
                    {iro.category}
                  </div>
                  <div
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold uppercase tracking-wider border ${getStatusBadgeStyle(
                      iro.status,
                    )}`}
                  >
                    {iro.status}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-6 space-y-6 flex-1">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs text-zinc-400 font-medium uppercase tracking-wider">
                      Ticker
                    </p>
                    <p className="font-bold text-zinc-900 uppercase">
                      {iro.token.symbol}
                    </p>
                  </div>
                  <div className="space-y-1 text-right">
                    <p className="text-xs text-zinc-400 font-medium uppercase tracking-wider">
                      Hard Cap
                    </p>
                    <p className="font-bold text-zinc-900">
                      ${parseFloat(iro.hardCap).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-3">
                  <div className="flex items-end justify-between text-sm">
                    <div className="space-y-0.5">
                      <span className="text-xs text-zinc-400">Raised</span>
                      <p className="font-bold text-zinc-900 text-base">
                        {iro.raised}
                      </p>
                    </div>
                    <span className="font-semibold text-[#F2723B] bg-orange-50 px-2 py-0.5 rounded-md text-xs">
                      {iro.progress}%
                    </span>
                  </div>
                  <div className="w-full bg-zinc-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-linear-to-r from-[#F2723B] to-[#fcb65a] h-full rounded-full transition-all duration-500 ease-out shadow-[0_0_10px_rgba(242,114,59,0.3)]"
                      style={{ width: `${iro.progress}%` }}
                    />
                  </div>
                </div>
              </CardContent>

              <CardFooter className="p-6 pt-0 mt-auto">
                <div className="w-full flex items-center justify-between gap-4">
                  <div className="flex items-center gap-1.5 text-xs text-zinc-500 font-medium bg-zinc-50 px-3 py-2 rounded-lg">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{iro.daysLeft} days left</span>
                  </div>
                  <Link href={`/iros/${iro.id}`} className="flex-1">
                    <Button
                      className={`w-full text-white shadow-md font-medium group transition-all ${
                        iro.status === "LIVE"
                          ? "bg-[#F2723B] hover:bg-[#d65f2c] shadow-orange-500/20"
                          : "bg-zinc-800 hover:bg-zinc-700 shadow-zinc-500/10"
                      }`}
                    >
                      {iro.status === "LIVE" ? (
                        <>
                          Participate
                          <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-0.5 transition-transform" />
                        </>
                      ) : iro.status === "SCHEDULED" ? (
                        "View Details"
                      ) : (
                        "View Results"
                      )}
                    </Button>
                  </Link>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
