"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usePrivy } from "@privy-io/react-auth";
import {
  fetchApplicationsFn,
  approveApplicationFn,
  CreatorApplication,
} from "@/services/admin/api";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, CheckCircle, XCircle, ExternalLink } from "lucide-react";
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
  const [selectedApp, setSelectedApp] = useState<CreatorApplication | null>(
    null
  );
  const [approvalSector, setApprovalSector] = useState<string>("");
  const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState(false);

  // Fetch Applications
  const { data: applications, isLoading } = useQuery({
    queryKey: ["admin", "applications"],
    queryFn: async () => {
      const token = await getAccessToken();
      if (!token) throw new Error("No token");
      return await fetchApplicationsFn(token);
    },
  });

  // Approve Mutation
  const approveMutation = useMutation({
    mutationFn: async ({ id, sector }: { id: string; sector: string }) => {
      const token = await getAccessToken();
      if (!token) throw new Error("No token");
      return await approveApplicationFn(token, id, sector);
    },
    onSuccess: () => {
      toast.success("Application approved successfully");
      queryClient.invalidateQueries({ queryKey: ["admin", "applications"] });
      setIsApprovalDialogOpen(false);
      setSelectedApp(null);
      setApprovalSector("");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to approve application");
    },
  });

  const handleOpenApproval = (app: CreatorApplication) => {
    setSelectedApp(app);
    setIsApprovalDialogOpen(true);
  };

  const confirmApproval = () => {
    if (!selectedApp || !approvalSector) {
      toast.error("Please select a sector");
      return;
    }
    approveMutation.mutate({ id: selectedApp.id, sector: approvalSector });
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
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-zinc-800">
          Creator Applications
        </h2>
        <Button onClick={() => queryClient.invalidateQueries()}>Refresh</Button>
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
                  <td className="px-6 py-4 text-right">
                    {app.state === "SUBMITTED" && (
                      <Button
                        size="sm"
                        className="bg-[#fc9816] hover:bg-[#e3860d] text-white"
                        onClick={() => handleOpenApproval(app)}
                      >
                        Review
                      </Button>
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
              Assign a sector to this creator to finalize their onboarding. This
              will create their public profile.
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
              disabled={approveMutation.isPending}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {approveMutation.isPending ? (
                <Loader2 className="animate-spin h-4 w-4 mr-2" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Approve Application
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
