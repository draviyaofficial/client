"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usePrivy } from "@privy-io/react-auth";
import Link from "next/link";
import {
  fetchApplicationsFn,
  updateApplicationStateFn,
  CreatorApplication,
} from "@/services/admin/api";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, CheckCircle, ExternalLink, XCircle } from "lucide-react";
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

const AdminDashboard = () => {
  const { getAccessToken } = usePrivy();
  const queryClient = useQueryClient();

  // State for Filters
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"asc" | "desc">("desc");
  const [timeRange, setTimeRange] = useState<string>("all");

  // State for Actions
  const [selectedApp, setSelectedApp] = useState<CreatorApplication | null>(
    null,
  );
  const [approvalSector, setApprovalSector] = useState<string>("");
  const [rejectionReason, setRejectionReason] = useState<string>("");

  const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);

  // Fetch Applications with Filters
  const { data: applications, isLoading } = useQuery({
    queryKey: ["admin", "applications", statusFilter, sortBy, timeRange],
    queryFn: async () => {
      const token = await getAccessToken();
      if (!token) throw new Error("No token");
      return await fetchApplicationsFn(token, {
        status: statusFilter,
        sortBy,
        timeRange: timeRange === "all" ? undefined : timeRange,
      });
    },
  });

  // State Update Mutation
  const updateStateMutation = useMutation({
    mutationFn: async ({
      id,
      state,
      sector,
      reason,
    }: {
      id: string;
      state: string;
      sector?: string;
      reason?: string;
    }) => {
      const token = await getAccessToken();
      if (!token) throw new Error("No token");
      return await updateApplicationStateFn(token, id, state, sector, reason);
    },
    onSuccess: (_, variables) => {
      toast.success(
        `Application ${variables.state.toLowerCase()} successfully`,
      );
      queryClient.invalidateQueries({ queryKey: ["admin", "applications"] });
      // Reset States
      setIsApprovalDialogOpen(false);
      setIsRejectDialogOpen(false);
      setSelectedApp(null);
      setApprovalSector("");
      setRejectionReason("");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update application");
    },
  });

  const handleReview = (app: CreatorApplication) => {
    updateStateMutation.mutate({ id: app.id, state: "UNDER_REVIEW" });
  };

  const handleOpenApprove = (app: CreatorApplication) => {
    setSelectedApp(app);
    setIsApprovalDialogOpen(true);
  };

  const handleOpenReject = (app: CreatorApplication) => {
    setSelectedApp(app);
    setIsRejectDialogOpen(true);
  };

  const confirmApproval = () => {
    if (!selectedApp || !approvalSector) {
      toast.error("Please select a sector");
      return;
    }
    updateStateMutation.mutate({
      id: selectedApp.id,
      state: "APPROVED",
      sector: approvalSector,
    });
  };

  const confirmRejection = () => {
    if (!selectedApp || !rejectionReason) {
      toast.error("Please provide a reason");
      return;
    }
    updateStateMutation.mutate({
      id: selectedApp.id,
      state: "REJECTED",
      reason: rejectionReason,
    });
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-zinc-800">
          Creator Applications
        </h2>
        <div className="flex gap-2">
          <Link href="/admin/tokens">
            <Button className="bg-[#F2723B] hover:bg-[#e06532] text-white">
              Manage Tokens
            </Button>
          </Link>
          <Button
            variant="outline"
            onClick={() => queryClient.invalidateQueries()}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-4 rounded-xl border border-zinc-200">
        <div className="space-y-2">
          <Label>Status</Label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="SUBMITTED">Submitted</SelectItem>
              <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
              <SelectItem value="APPROVED">Approved</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
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
                <th className="px-6 py-4 font-medium">Applicant</th>
                <th className="px-6 py-4 font-medium">Contact</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Socials</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {applications?.data?.map((app: CreatorApplication) => (
                <tr key={app.id} className="hover:bg-zinc-50/50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-zinc-900">{app.name}</div>
                    <div
                      className="text-zinc-500 text-xs truncate max-w-[200px]"
                      title={app.description}
                    >
                      {app.description}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-zinc-900">{app.emailAddress}</div>
                    <div className="text-zinc-500 text-xs text-nowrap">
                      {app.contactNumber}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge status={app.state} />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      {app.socials.map((s, i) => (
                        <a
                          key={i}
                          href={s.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-500 hover:text-blue-700"
                          title={s.platform}
                        >
                          <ExternalLink size={14} />
                        </a>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    {app.state === "SUBMITTED" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleReview(app)}
                        disabled={updateStateMutation.isPending}
                      >
                        {updateStateMutation.isPending ? (
                          <Loader2 className="animate-spin h-3 w-3" />
                        ) : (
                          "Review"
                        )}
                      </Button>
                    )}

                    {app.state === "UNDER_REVIEW" && (
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
                  </td>
                </tr>
              ))}

              {applications?.data?.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-zinc-400"
                  >
                    No applications found.
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
            <DialogTitle>Approve Creator</DialogTitle>
            <DialogDescription>
              Assign a sector to this creator to finalize their onboarding.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Sector</Label>
              <Select onValueChange={setApprovalSector} value={approvalSector}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a sector" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="GAMING">Gaming</SelectItem>
                  <SelectItem value="LIFESTYLE">Lifestyle</SelectItem>
                  <SelectItem value="FINANCE">Finance</SelectItem>
                  <SelectItem value="TECH">Tech</SelectItem>
                  <SelectItem value="ENTERTAINMENT">Entertainment</SelectItem>
                  <SelectItem value="EDUCATION">Education</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="p-4 bg-zinc-50 rounded-lg text-sm space-y-2 border border-zinc-100">
              <p>
                <span className="font-semibold">Name:</span> {selectedApp?.name}
              </p>
              <p>
                <span className="font-semibold">Bio:</span>{" "}
                {selectedApp?.description}
              </p>
            </div>
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
              disabled={updateStateMutation.isPending}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {updateStateMutation.isPending ? (
                <Loader2 className="animate-spin h-4 w-4 mr-2" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rejection Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>Reject Application</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejection. This will be sent to the
              applicant.
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
              disabled={updateStateMutation.isPending}
              variant="destructive"
            >
              {updateStateMutation.isPending ? (
                <Loader2 className="animate-spin h-4 w-4 mr-2" />
              ) : (
                <XCircle className="h-4 w-4 mr-2" />
              )}
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Helper Component for Status Badge
const Badge = ({ status }: { status: string }) => {
  const styles: Record<string, string> = {
    SUBMITTED: "bg-blue-100 text-blue-700 border-blue-200",
    UNDER_REVIEW: "bg-yellow-100 text-yellow-700 border-yellow-200",
    APPROVED: "bg-green-100 text-green-700 border-green-200",
    REJECTED: "bg-red-100 text-red-700 border-red-200",
  };

  return (
    <span
      className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
        styles[status] || "bg-zinc-100 text-zinc-700 border-zinc-200"
      }`}
    >
      {status.replace("_", " ")}
    </span>
  );
};

export default AdminDashboard;
