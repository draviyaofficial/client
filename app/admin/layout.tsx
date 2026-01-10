"use client";

import React, { useEffect } from "react";
import { useUser } from "@/services/auth/model/hooks/useUser";
import { useRouter, usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: user, isLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Allow access to login page without check
    if (pathname === "/admin/login") return;

    if (!isLoading) {
      if (!user || user.role !== "ADMIN") {
        router.push("/admin/login");
      }
    }
  }, [user, isLoading, router, pathname]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#f9efe3]">
        <Loader2 className="h-8 w-8 animate-spin text-[#fc9816]" />
      </div>
    );
  }

  // If on login page, render children directly (AuthCard layout)
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  // Admin Dashboard Layout
  return (
    <div className="min-h-screen bg-[#f9efe3] font-sans text-slate-900">
      <header className="bg-white border-b border-zinc-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#fc9816] rounded-lg" />
          <h1 className="font-bold text-xl tracking-tight">Admin Portal</h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-zinc-600">
            {user?.name || "Admin"}
          </span>
        </div>
      </header>
      <main className="p-6 md:p-10 max-w-7xl mx-auto">{children}</main>
    </div>
  );
}
