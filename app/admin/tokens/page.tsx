"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usePrivy } from "@privy-io/react-auth";
import {
  fetchTokenApplicationsFn,
  approveTokenApplicationFn,
  rejectTokenApplicationFn,
  TokenApplication,
} from "@/services/token/api";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, CheckCircle, XCircle, ArrowLeft } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import NextImage from "next/image";
import { Input } from "@/components/ui/input";

const AdminTokensPage = () => {
  const { getAccessToken } = usePrivy();
  const queryClient = useQueryClient();

  // State for Filters
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"asc" | "desc">("desc");
  const [timeRange, setTimeRange] = useState<string>("all");
  const [search, setSearch] = useState<string>("");

  // State for Actions
  const [selectedApp, setSelectedApp] = useState<TokenApplication | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>("");

  const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);

  // Fetch Applications with Filters
  const { data: applications, isLoading } = useQuery({
    queryKey: [
      "admin",
      "token-applications",
      statusFilter,
      sortBy,
      timeRange,
      search,
    ],
    queryFn: async () => {
      const token = await getAccessToken();
      if (!token) throw new Error("No token");
      return await fetchTokenApplicationsFn(token, {
        status: statusFilter,
        sortBy,
        timeRange: timeRange === "all" ? undefined : timeRange,
        search: search || undefined,
      });
    },
  });

  // Approve Mutation
  const approveMutation = useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      const token = await getAccessToken();
      if (!token) throw new Error("No token");
      return await approveTokenApplicationFn(token, id, "APPROVED");
    },
    onSuccess: () => {
      toast.success("Application approved successfully");
      queryClient.invalidateQueries({
        queryKey: ["admin", "token-applications"],
      });
      setIsApprovalDialogOpen(false);
      setSelectedApp(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to approve application");
    },
  });

  // Reject Mutation
  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const token = await getAccessToken();
      if (!token) throw new Error("No token");
      return await rejectTokenApplicationFn(token, id, reason);
    },
    onSuccess: () => {
      toast.success("Application rejected successfully");
      queryClient.invalidateQueries({
        queryKey: ["admin", "token-applications"],
      });
      setIsRejectDialogOpen(false);
      setSelectedApp(null);
      setRejectionReason("");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to reject application");
    },
  });

  const handleOpenApprove = (app: TokenApplication) => {
    setSelectedApp(app);
    setIsApprovalDialogOpen(true);
  };

  const handleOpenReject = (app: TokenApplication) => {
    setSelectedApp(app);
    setIsRejectDialogOpen(true);
  };

  const confirmApproval = () => {
    if (!selectedApp) return;
    approveMutation.mutate({ id: selectedApp.id });
  };

  const confirmRejection = () => {
    if (!selectedApp || !rejectionReason) {
      toast.error("Please provide a reason");
      return;
    }
    rejectMutation.mutate({ id: selectedApp.id, reason: rejectionReason });
  };

  if (isLoading) {
    return (
      <div className="flex w-full justify-center py-20">
        <Loader2 className="animate-spin h-8 w-8 text-zinc-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/dashboard">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h2 className="text-2xl font-bold text-zinc-800">Token Applications</h2>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-4 rounded-xl border border-zinc-200">
        <div className="space-y-2">
          <Label>Search</Label>
          <Input
            placeholder="Search by name or symbol"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Status</Label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="SUBMITTED">Submitted</SelectItem>
              <SelectItem value="APPROVED">Approved</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
              <SelectItem value="MINTED">Minted</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Time Range</Label>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by time" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="last24hr">Last 24 Hours</SelectItem>
              <SelectItem value="lastWeek">Last Week</SelectItem>
              <SelectItem value="lastMonth">Last Month</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Sort Order</Label>
          <Select
            value={sortBy}
            onValueChange={(v: string) => setSortBy(v as "asc" | "desc")}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="desc">Newest First</SelectItem>
              <SelectItem value="asc">Oldest First</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-zinc-500 bg-zinc-50 border-b border-zinc-200">
              <tr>
                <th className="px-6 py-4 font-medium">Asset</th>
                <th className="px-6 py-4 font-medium">Creator</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Links</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {applications?.data?.map((app: TokenApplication) => {
                const isActionable = app.status === "SUBMITTED";
                return (
                  <tr key={app.id} className="hover:bg-zinc-50/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {app.logoUrl ? (
                          <NextImage
                            src={app.logoUrl}
                            alt={app.symbol}
                            width={32}
                            height={32}
                            className="w-8 h-8 rounded-full bg-zinc-100"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-xs font-bold text-zinc-500">
                            {app.symbol[0]}
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-zinc-900">
                            {app.name} (${app.symbol})
                          </div>
                          <div className="text-zinc-500 text-xs">
                            Supply:{" "}
                            {parseInt(app.initialSupply).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-zinc-900">
                        {app.user?.firstName || "Unknown"}
                      </div>
                      <div className="text-zinc-500 text-xs">
                        {app.user?.email || "No Email"}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge status={app.status} />
                      {app.status === "REJECTED" && app.rejectionReason && (
                        <div
                          className="text-xs text-red-500 mt-1 max-w-[200px] truncate"
                          title={app.rejectionReason}
                        >
                          Reason: {app.rejectionReason}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        {app.websiteUrl && (
                          <SocialLink href={app.websiteUrl} label="Web" />
                        )}
                        {app.twitterUrl && (
                          <SocialLink href={app.twitterUrl} label="Tw" />
                        )}
                        {app.telegramUrl && (
                          <SocialLink href={app.telegramUrl} label="Tg" />
                        )}
                        {app.discordUrl && (
                          <SocialLink href={app.discordUrl} label="Ds" />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      {isActionable && (
                        <>
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => handleOpenApprove(app)}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleOpenReject(app)}
                          >
                            Reject
                          </Button>
                        </>
                      )}
                      {!isActionable && (
                        <span className="text-xs text-zinc-400 italic">
                          No actions
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}

              {applications?.data?.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-zinc-400"
                  >
                    No token applications found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Approval Dialog */}
      <Dialog
        open={isApprovalDialogOpen}
        onOpenChange={setIsApprovalDialogOpen}
      >
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>Approve Token Application</DialogTitle>
            <DialogDescription>
              Are you sure you want to approve this token? This will allow the
              creator to proceed with minting.
            </DialogDescription>
          </DialogHeader>

          <div className="p-4 bg-zinc-50 rounded-lg text-sm space-y-2 border border-zinc-100">
            <p>
              <span className="font-semibold">Token:</span> {selectedApp?.name}{" "}
              ({selectedApp?.symbol})
            </p>
            <p>
              <span className="font-semibold">Description:</span>{" "}
              {selectedApp?.description}
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsApprovalDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmApproval}
              disabled={approveMutation.isPending}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {approveMutation.isPending ? (
                <Loader2 className="animate-spin h-4 w-4 mr-2" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Confirm Approval
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rejection Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>Reject Token Application</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejection. This will be sent to the
              creator.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Rejection Reason</Label>
              <textarea
                className="flex w-full rounded-md border border-zinc-200 bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 min-h-[100px]"
                placeholder="Reason for rejection..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsRejectDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmRejection}
              disabled={rejectMutation.isPending}
              variant="destructive"
            >
              {rejectMutation.isPending ? (
                <Loader2 className="animate-spin h-4 w-4 mr-2" />
              ) : (
                <XCircle className="h-4 w-4 mr-2" />
              )}
              Reject Application
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Helper Components
const Badge = ({ status }: { status: string }) => {
  const styles: Record<string, string> = {
    DRAFT: "bg-gray-100 text-gray-700 border-gray-200",
    SUBMITTED: "bg-blue-100 text-blue-700 border-blue-200",
    APPROVED: "bg-green-100 text-green-700 border-green-200",
    MINTED: "bg-purple-100 text-purple-700 border-purple-200",
    REJECTED: "bg-red-100 text-red-700 border-red-200",
  };

  return (
    <span
      className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
        styles[status] || "bg-zinc-100 text-zinc-700 border-zinc-200"
      }`}
    >
      {status}
    </span>
  );
};

const SocialLink = ({ href, label }: { href: string; label: string }) => (
  <a
    href={href}
    target="_blank"
    rel="noreferrer"
    className="text-xs bg-zinc-100 hover:bg-zinc-200 text-zinc-600 px-2 py-1 rounded transition-colors"
  >
    {label}
  </a>
);

export default AdminTokensPage;
