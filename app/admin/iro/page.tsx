"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { listIROsFn, IRO } from "@/services/iro/api";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function AdminIROPage() {
  const [statusFilter] = useState<string>("all");

  const { data: iros, isLoading } = useQuery({
    queryKey: ["admin", "iros", statusFilter],
    queryFn: async () => {
      // Assuming listIROsFn is public or handles auth internally if needed,
      // but usually admin endpoints need token.
      // However, listIROsFn implementation in step 33 seems public (no token arg).
      // If it requires auth, it should have taken a token.
      // Based on step 33, it does NOT take a token. It calls /v1/iro/list.
      const res = await listIROsFn({
        status: statusFilter === "all" ? undefined : statusFilter,
      });
      return res.data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex w-full justify-center py-20">
        <Loader2 className="animate-spin h-8 w-8 text-zinc-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-zinc-800">IRO Management</h2>
        <Link href="/admin/iro/create">
          <Button className="bg-[#fc9816] hover:bg-[#e08610] text-white">
            Create New IRO
          </Button>
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-zinc-500 bg-zinc-50 border-b border-zinc-200">
              <tr>
                <th className="px-6 py-4 font-medium">Token</th>
                <th className="px-6 py-4 font-medium">Creator</th>
                <th className="px-6 py-4 font-medium">Timing</th>
                <th className="px-6 py-4 font-medium">Progress</th>
                <th className="px-6 py-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {iros?.map((iro: IRO) => (
                <tr key={iro.id} className="hover:bg-zinc-50/50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-zinc-900">
                      {iro.token.name} (${iro.token.symbol})
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-zinc-900">
                      {iro.token.user.creatorProfile?.displayName || "Unknown"}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-xs text-zinc-500 space-y-1">
                      <div>
                        Start: {new Date(iro.startTime).toLocaleDateString()}
                      </div>
                      <div>
                        End: {new Date(iro.endTime).toLocaleDateString()}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-zinc-900">
                      {/* Placeholder for progress since API doesn't return raised amount yet in the interface? 
                            The IRO interface has hardCap and tokensForSale. 
                            If there's no 'raised' field, we can't show progress. 
                            I'll just show Hard Cap for now.
                         */}
                      {iro.hardCap.toLocaleString()} USDC
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                        iro.status === "LIVE"
                          ? "bg-green-100 text-green-700 border-green-200"
                          : iro.status === "SCHEDULED"
                            ? "bg-blue-100 text-blue-700 border-blue-200"
                            : iro.status === "COMPLETED"
                              ? "bg-zinc-100 text-zinc-700 border-zinc-200"
                              : "bg-red-100 text-red-700 border-red-200"
                      }`}
                    >
                      {iro.status}
                    </span>
                  </td>
                </tr>
              ))}
              {iros?.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-zinc-400"
                  >
                    No IROs found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
