import React from "react";
import { ArrowRight } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  variant?: "default" | "orange";
}

export function StatCard({
  title,
  value,
  change,
  variant = "default",
}: StatCardProps) {
  const isOrange = variant === "orange" || title === "Portfolio Value"; // Backward compatibility

  return (
    <div
      className={`rounded-3xl p-5 h-full flex flex-col justify-between ${
        !isOrange ? "bg-[#f9efe3]" : "bg-[#F2723B]"
      }`}
    >
      <div className="flex w-full items-center justify-between">
        <div className="w-full">
          <div className="flex justify-between items-center">
            <p
              className={`text-lg font-medium ${
                isOrange ? "text-gray-200" : "text-zinc-900"
              }`}
            >
              {title}
            </p>
            <div className="h-12 w-12 rounded-full bg-white flex items-center justify-center shrink-0">
              <ArrowRight className="h-7 w-7 text-zinc-600 -rotate-45" />
            </div>
          </div>
          <p
            className={`text-[2.8rem] font-semibold leading-tight ${
              isOrange ? "text-white" : "text-zinc-900"
            } mt-3`}
          >
            {value}
          </p>
        </div>
      </div>
      <div className="mt-7">
        <p
          className={`text-sm font-medium ${
            isOrange ? "text-[#f7e1c5]" : "text-[#F2723B]"
          }`}
        >
          {change}
        </p>
      </div>
    </div>
  );
}
