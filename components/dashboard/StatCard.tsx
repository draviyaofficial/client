import React from "react";
import { ArrowRight } from "lucide-react";

import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  icon: LucideIcon;
  variant?: "default" | "orange" | "gradient";
}

export function StatCard({
  title,
  value,
  change,
  variant = "default",
  icon: Icon,
}: StatCardProps) {
  // The 'isOrange' variable from the original code is no longer used with the new return block logic.
  // const isOrange = variant === "orange" || title === "Portfolio Value"; // Backward compatibility

  return (
    <div
      className={`rounded-3xl p-5 h-full flex flex-col justify-between relative overflow-hidden ${
        variant === "gradient"
          ? "bg-linear-to-br from-[#1a1c2e] to-[#2d3250] text-white shadow-xl"
          : variant === "orange"
            ? "bg-[#F2723B] text-white"
            : "bg-[#f9efe3]" // Default beige/white-ish
      }`}
    >
      {variant === "gradient" && (
        <>
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none" />
        </>
      )}
      <div className="space-y-4 relative z-10">
        <div className="flex items-start justify-between">
          <div
            className={`p-2 rounded-xl transition-colors ${
              variant === "gradient"
                ? "bg-white/10 text-white backdrop-blur-sm"
                : variant === "orange"
                  ? "bg-white/20 text-white"
                  : "bg-white text-[#F2723B]"
            }`}
          >
            <Icon className="w-6 h-6" />
          </div>
          {/* Additional header content can go here */}
        </div>
        <div>
          <h3
            className={`text-sm font-medium ${
              variant === "gradient" || variant === "orange"
                ? "text-indigo-100"
                : "text-zinc-500"
            }`}
          >
            {title}
          </h3>
          <p
            className={`text-3xl font-bold mt-1 ${
              variant === "gradient" || variant === "orange"
                ? "text-white"
                : "text-zinc-900"
            }`}
          >
            {value}
          </p>
        </div>
      </div>
      <div className="pt-4 relative z-10">
        <p
          className={`text-sm font-medium ${
            variant === "gradient" || variant === "orange"
              ? "text-indigo-200"
              : "text-zinc-600"
          }`}
        >
          {change}
        </p>
      </div>
    </div>
  );
}
