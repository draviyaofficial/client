"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Coins, Rocket, LogOut } from "lucide-react";
import { useAuth } from "@/services/auth/model/hooks/useAuth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const sidebarItems = [
  {
    title: "Dashboard",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Token Applications",
    href: "/admin/tokens",
    icon: Coins,
  },
  {
    title: "IRO Management",
    href: "/admin/iro",
    icon: Rocket,
  },
];

export const AdminSidebar = () => {
  const pathname = usePathname();
  const { logout } = useAuth();

  return (
    <div className="hidden md:flex flex-col w-64 h-screen bg-white border-r border-zinc-200 fixed left-0 top-0 z-50">
      <div className="p-6 border-b border-zinc-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#fc9816] rounded-lg flex items-center justify-center text-white font-bold">
            D
          </div>
          <span className="font-bold text-xl tracking-tight text-zinc-900">
            Admin Panel
          </span>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {sidebarItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href}>
              <span
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-[#fff7ed] text-[#ea580c]"
                    : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900",
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.title}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-zinc-100">
        <Button
          variant="ghost"
          className="w-full justify-start text-zinc-600 hover:text-red-600 hover:bg-red-50"
          onClick={logout}
        >
          <LogOut className="w-5 h-5 mr-3" />
          Sign Out
        </Button>
      </div>
    </div>
  );
};
