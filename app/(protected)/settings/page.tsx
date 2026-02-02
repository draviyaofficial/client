"use client";

import React, { useState } from "react";
import { useUser } from "@/services/auth/model/hooks/useUser";
import { Shield, Bell, User, Save, AlertTriangle, X } from "lucide-react";

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
    }
    // If dbUser is not yet loaded or empty, we could fallback to `user` (Privy user)
    // but typically `dbUser` is the source of truth for these profile fields.
    // We can initialize email from `user` if `dbUser` is missing.
    else if (user) {
      // Try to parse name if available and not set
      // But user requested "initially there would be no name" if not set in DB
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
      <div className="bg-white rounded-xl p-10 space-y-12">
        {/* Header Skeleton */}
        <div className="space-y-2">
          <Skeleton className="h-12 w-48" />
          <Skeleton className="h-6 w-96" />
        </div>

        {/* Profile Skeleton */}
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-12 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-12 w-full" />
            </div>
            <div className="md:col-span-2 space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-12 w-full" />
            </div>
            <div className="md:col-span-2 space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
          <div className="flex justify-end">
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-10 space-y-12">
      {/* Header */}
      <div>
        <h1 className="text-5xl font-semibold tracking-tight text-zinc-900">
          Settings
        </h1>
        <p className="text-zinc-400 mt-1 text-lg">
          Manage your account preferences and security settings.
        </p>
      </div>

      {/* Profile Settings */}
      <section className="space-y-6">
        <div className="flex items-center gap-2 border-b border-zinc-100 pb-4">
          <User className="h-6 w-6 text-zinc-400" />
          <h2 className="text-2xl font-medium text-zinc-900">
            Profile Information
          </h2>
        </div>

        <div className="flex items-center gap-6 py-4">
          <div className="w-24 h-24 rounded-full overflow-hidden border border-zinc-200 bg-zinc-50 shrink-0">
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
          <div className="flex-1 max-w-sm">
            <ImageUpload
              value={profilePicUrl}
              onChange={setProfilePicUrl}
              disabled={isPending}
            />
            <p className="text-xs text-zinc-500 mt-2">
              Recommended: Square image, max 5MB.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">
              First Name
            </label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Enter your first name"
              className="w-full px-4 py-3 border border-zinc-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">
              Last Name
            </label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Enter your last name"
              className="w-full px-4 py-3 border border-zinc-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-zinc-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              disabled
              className="w-full px-4 py-3 border border-zinc-200 rounded-lg bg-zinc-50 text-zinc-500 cursor-not-allowed"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-zinc-700 mb-2">
              Country
            </label>
            <Select value={country} onValueChange={setCountry}>
              <SelectTrigger className="w-full px-4 py-3 h-auto border border-zinc-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none">
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

        <div className="flex justify-end pt-4">
          <button
            onClick={() => updateProfile()}
            disabled={isPending}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 text-sm font-medium text-white hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {isPending ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </section>

      {/* KYC Status */}
      <section className="space-y-6">
        <div className="flex items-center gap-2 border-b border-zinc-100 pb-4">
          <Shield className="h-6 w-6 text-zinc-400" />
          <h2 className="text-2xl font-medium text-zinc-900">
            Verification & KYC
          </h2>
        </div>

        <div className="rounded-xl border border-zinc-200 p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <p className="text-lg font-medium text-zinc-900">
                Identity Verification
              </p>
              <p className="text-zinc-500 mt-1 max-w-xl">
                Complete KYC to unlock higher investment limits and additional
                features.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
                  kycStatus === "verified"
                    ? "text-green-700 bg-green-50"
                    : kycStatus === "pending"
                      ? "text-yellow-700 bg-yellow-50"
                      : "text-red-700 bg-red-50"
                }`}
              >
                {kycStatus === "verified" ? (
                  <Shield className="h-4 w-4" />
                ) : kycStatus === "pending" ? (
                  <AlertTriangle className="h-4 w-4" />
                ) : (
                  <X className="h-4 w-4" />
                )}
                <span className="capitalize">{kycStatus}</span>
              </div>
              {kycStatus !== "verified" && (
                <button className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors">
                  {kycStatus === "pending"
                    ? "Complete KYC"
                    : "Start Verification"}
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Notification Preferences */}
      <section className="space-y-6">
        <div className="flex items-center gap-2 border-b border-zinc-100 pb-4">
          <Bell className="h-6 w-6 text-zinc-400" />
          <h2 className="text-2xl font-medium text-zinc-900">
            Notification Preferences
          </h2>
        </div>

        <div className="space-y-6">
          {[
            {
              key: "email",
              label: "Email Notifications",
              description:
                "Receive updates about your investments and platform news",
            },
            {
              key: "push",
              label: "Push Notifications",
              description: "Get instant notifications on your device",
            },
            {
              key: "sms",
              label: "SMS Notifications",
              description: "Receive important alerts via text message",
            },
            {
              key: "marketing",
              label: "Marketing Communications",
              description:
                "Receive promotional offers and new feature announcements",
            },
          ].map(({ key, label, description }) => (
            <div key={key} className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium text-zinc-900">{label}</p>
                <p className="text-sm text-zinc-500">{description}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifications[key as keyof typeof notifications]}
                  onChange={(e) =>
                    setNotifications((prev) => ({
                      ...prev,
                      [key]: e.target.checked,
                    }))
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>
          ))}
        </div>
      </section>

      {/* Danger Zone */}
      <div className="rounded-xl border border-red-200 bg-red-50 shadow-sm overflow-hidden">
        <div className="border-b border-red-100 bg-red-50 px-6 py-4">
          <h2 className="font-semibold text-red-900">Danger Zone</h2>
        </div>

        <div className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-red-900">Disconnect Wallet</p>
              <p className="text-sm text-red-700 mt-1">
                This will disconnect your wallet from the platform. You can
                reconnect at any time.
              </p>
            </div>
            <button className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors">
              Disconnect
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
