"use client";

import React, { useState } from "react";
import { useUser } from "@/services/auth/model/hooks/useUser";
import {
  Shield,
  Bell,
  User,
  Save,
  AlertTriangle,
  X,
  Settings,
  Check,
} from "lucide-react";

import { usePrivy } from "@privy-io/react-auth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { updateUserFn, fetchMeFn } from "@/services/auth/model/api/mutations";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import ImageUpload from "@/components/ui/image-upload";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { countries } from "@/lib/constants/countries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export default function SettingsPage() {
  const { data: user, isLoading: isUserLoading } = useUser();
  const { getAccessToken, authenticated } = usePrivy();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [country, setCountry] = useState("");
  const [email, setEmail] = useState("");
  const [profilePicUrl, setProfilePicUrl] = useState("");

  const { data: dbUser, isLoading: isDbUserLoading } = useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const token = await getAccessToken();
      if (!token) return null;
      return fetchMeFn(token);
    },
    enabled: authenticated,
  });

  const isLoading = isUserLoading || isDbUserLoading;

  // Sync state with user data when available
  React.useEffect(() => {
    if (dbUser) {
      setFirstName(dbUser.firstName || "");
      setLastName(dbUser.lastName || "");
      setCountry(dbUser.country || "");
      setEmail(dbUser.email || "");
      setProfilePicUrl(dbUser.profilePicUrl || "");
    } else if (user) {
      setEmail(user.email || "");
    }
  }, [dbUser, user]);

  const queryClient = useQueryClient();

  const { mutate: updateProfile, isPending } = useMutation({
    mutationFn: async () => {
      const token = await getAccessToken();
      if (!token) throw new Error("No token");

      return updateUserFn(
        { firstName, lastName, country, profilePicUrl: profilePicUrl || "" },
        token,
      );
    },
    onSuccess: () => {
      toast.success("Profile updated successfully");
      queryClient.invalidateQueries({ queryKey: ["me"] });
    },
    onError: (err) => {
      toast.error("Failed to update profile");
      console.error(err);
    },
  });

  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    sms: false,
    marketing: false,
  });
  const [kycStatus] = useState("pending"); // Mock KYC status

  if (isLoading) {
    return (
      <div className="bg-zinc-50/50 rounded-xl p-10 min-h-[calc(100vh-2.5rem)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#F2723B]" />
      </div>
    );
  }

  return (
    <div className="space-y-8 bg-white rounded-xl min-h-[calc(100vh-2.5rem)] p-10">
      {/* Header */}
      <div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-zinc-100 text-[#F2723B]">
              <Settings className="w-6 h-6" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
              Settings
            </h1>
          </div>
          <p className="text-zinc-500 mt-1 max-w-xl">
            Manage your personal information, security preferences, and account
            settings.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 p-6 pt-0">
        {/* Navigation Sidebar (could be added later, for now just vertical stack) */}

        {/* Main Form Area */}
        <div className="lg:col-span-2 space-y-8">
          {/* Profile Settings */}
          <div className="bg-white rounded-xl border border-zinc-200 shadow-xs overflow-hidden">
            <div className="p-6 border-b border-zinc-100 bg-zinc-50/30">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-[#F2723B]" />
                <h2 className="text-lg font-semibold text-zinc-900">
                  Profile Information
                </h2>
              </div>
              <p className="text-sm text-zinc-500 mt-1">
                Update your public profile details.
              </p>
            </div>

            <div className="p-6 space-y-6">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="shrink-0">
                  <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-zinc-100 shadow-md">
                    {profilePicUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={profilePicUrl}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-zinc-100 text-zinc-400">
                        <User className="w-8 h-8" />
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex-1 w-full space-y-2">
                  <Label>Profile Picture</Label>
                  <ImageUpload
                    value={profilePicUrl}
                    onChange={setProfilePicUrl}
                    disabled={isPending}
                  />
                  <p className="text-xs text-zinc-500">
                    Recommended: Square JPG, PNG. Max 5MB.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>First Name</Label>
                  <Input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Enter your first name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Last Name</Label>
                  <Input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Enter your last name"
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label>Email Address</Label>
                  <Input
                    type="email"
                    value={email}
                    disabled
                    className="bg-zinc-50 text-zinc-500"
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label>Country</Label>
                  <Select value={country} onValueChange={setCountry}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your country" />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((c) => (
                        <SelectItem key={c.value} value={c.value}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-zinc-50">
                <Button
                  onClick={() => updateProfile()}
                  disabled={isPending}
                  className="bg-[#1a1c2e] hover:bg-[#2d3250] text-white"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* KYC Status */}
          <div className="bg-white rounded-xl border border-zinc-200 shadow-xs overflow-hidden">
            <div className="p-6 border-b border-zinc-100 bg-zinc-50/30">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-indigo-500" />
                <h2 className="text-lg font-semibold text-zinc-900">
                  Verification & KYC
                </h2>
              </div>
              <p className="text-sm text-zinc-500 mt-1">
                Complete verification to unlock higher limits.
              </p>
            </div>

            <div className="p-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-4 rounded-xl border border-zinc-100 bg-zinc-50/50">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-zinc-900">Identity Status</p>
                    <div
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        kycStatus === "verified"
                          ? "text-green-700 bg-green-100"
                          : kycStatus === "pending"
                            ? "text-yellow-700 bg-yellow-100"
                            : "text-red-700 bg-red-100"
                      }`}
                    >
                      {kycStatus === "verified" ? (
                        <Check className="h-3 w-3" />
                      ) : kycStatus === "pending" ? (
                        <AlertTriangle className="h-3 w-3" />
                      ) : (
                        <X className="h-3 w-3" />
                      )}
                      <span className="capitalize">{kycStatus}</span>
                    </div>
                  </div>
                  <p className="text-sm text-zinc-500 max-w-md">
                    Based on your current level, you have a daily withdrawal
                    limit of 10 SOL.
                  </p>
                </div>

                {kycStatus !== "verified" && (
                  <Button
                    variant="outline"
                    className="border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                  >
                    {kycStatus === "pending"
                      ? "Complete KYC"
                      : "Start Verification"}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Settings */}
        <div className="space-y-8">
          {/* Notification Preferences */}
          <div className="bg-white rounded-xl border border-zinc-200 shadow-xs overflow-hidden">
            <div className="p-6 border-b border-zinc-100 bg-zinc-50/30">
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-zinc-500" />
                <h2 className="text-lg font-semibold text-zinc-900">
                  Notifications
                </h2>
              </div>
            </div>
            <div className="p-6 space-y-6">
              {[
                {
                  key: "email",
                  label: "Email Updates",
                  description: "Project updates & news",
                },
                {
                  key: "push",
                  label: "Push Notifications",
                  description: "Instant alerts on device",
                },
                {
                  key: "marketing",
                  label: "Marketing",
                  description: "Promotions & offers",
                },
              ].map(({ key, label, description }) => (
                <div key={key} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm text-zinc-900">{label}</p>
                  </div>
                  <Switch
                    checked={!!notifications[key as keyof typeof notifications]}
                    onCheckedChange={(checked: boolean) =>
                      setNotifications((prev) => ({ ...prev, [key]: checked }))
                    }
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-red-50 rounded-xl border border-red-100 overflow-hidden">
            <div className="p-6 border-b border-red-100 bg-red-100/50">
              <h2 className="text-red-900 font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> Danger Zone
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-xs text-red-700">
                Disconnecting your wallet will remove access to your dashboard
                until you reconnect.
              </p>
              <Button
                variant="destructive"
                className="w-full bg-red-600 hover:bg-red-700"
              >
                Disconnect Wallet
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Loader2(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}
