"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { LogOut, User as UserIcon, Shield, Mail } from "lucide-react"; // Icons

import { useAuth } from "@/services/auth/model/hooks/useAuth";
import { useUser } from "@/services/auth/model/hooks/useUser";

export default function DashboardPage() {
  const router = useRouter();

  // 1. Get User Data
  const { data: user, isLoading } = useUser();

  // 2. Get Logout Action
  const { logout, isLoggingOut } = useAuth();

  // 3. Protect the Route
  // (Simple client-side protection; Middleware is recommended for real apps)
  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [user, isLoading, router]);

  const handleLogout = () => {
    logout(undefined, {
      onSuccess: () => {
        toast.info("Logged out", {
          description: "You have been safely logged out.",
        });
        // Redirect handled in useAuth
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-pulse text-zinc-500">Loading dashboard...</div>
      </div>
    );
  }

  if (!user) return null; // Prevent flash of content before redirect

  return (
    <div className="min-h-screen bg-zinc-50/50 p-6 md:p-12">
      <div className="mx-auto max-w-2xl space-y-8">
        {/* Header Section */}
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
              Dashboard
            </h1>
            <p className="text-zinc-500">Manage your account and settings.</p>
          </div>
          <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-lg">
            {user.name.charAt(0).toUpperCase()}
          </div>
        </header>

        {/* User Details Card */}
        <div className="rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-zinc-100 bg-zinc-50/50 px-6 py-4">
            <h2 className="font-semibold text-zinc-900">Profile Information</h2>
          </div>

          <dl className="divide-y divide-zinc-100">
            {/* Name */}
            <div className="grid grid-cols-1 gap-1 p-6 sm:grid-cols-3 sm:gap-4 hover:bg-zinc-50 transition-colors">
              <dt className="flex items-center gap-2 font-medium text-zinc-500 text-sm">
                <UserIcon className="h-4 w-4" /> Name
              </dt>
              <dd className="text-zinc-900 sm:col-span-2 font-medium">
                {user.name}
              </dd>
            </div>

            {/* Email */}
            <div className="grid grid-cols-1 gap-1 p-6 sm:grid-cols-3 sm:gap-4 hover:bg-zinc-50 transition-colors">
              <dt className="flex items-center gap-2 font-medium text-zinc-500 text-sm">
                <Mail className="h-4 w-4" /> Email
              </dt>
              <dd className="text-zinc-900 sm:col-span-2">{user.email}</dd>
            </div>

            {/* Role / ID */}
            <div className="grid grid-cols-1 gap-1 p-6 sm:grid-cols-3 sm:gap-4 hover:bg-zinc-50 transition-colors">
              <dt className="flex items-center gap-2 font-medium text-zinc-500 text-sm">
                <Shield className="h-4 w-4" /> ID
              </dt>
              <dd className="font-mono text-xs text-zinc-500 sm:col-span-2 mt-1">
                {user.id}
              </dd>
            </div>
          </dl>
        </div>

        {/* Actions */}
        <div className="flex justify-end">
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="flex items-center gap-2 rounded-lg bg-red-50 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50"
          >
            {isLoggingOut ? (
              <>Processing...</>
            ) : (
              <>
                <LogOut className="h-4 w-4" /> Sign out
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
