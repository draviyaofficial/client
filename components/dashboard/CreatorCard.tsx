import React from "react";
import Link from "next/link";
import { Clock } from "lucide-react";

interface CreatorCardProps {
  id: string;
  creator: string;
  name: string;
  description: string;
  progress: number;
  target: string;
  raised: string;
  category: string;
  avatar?: string | null;
  status: "SCHEDULED" | "LIVE" | "COMPLETED" | "FAILED";
  startTime: string;
  endTime: string;
}

export function CreatorCard({
  id,
  creator,
  name,
  description,
  progress,
  target,
  raised,
  category,
  avatar,
  status,
  startTime,
  endTime,
}: CreatorCardProps) {
  // Calculate time display based on status
  const getTimeDisplay = () => {
    const now = new Date();
    if (status === "SCHEDULED") {
      const start = new Date(startTime);
      const diffTime = start.getTime() - now.getTime();
      const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return `Starts in ${Math.max(0, days)} days`;
    } else if (status === "LIVE") {
      const end = new Date(endTime);
      const diffTime = end.getTime() - now.getTime();
      const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return `${Math.max(0, days)} days left`;
    } else {
      return "Ended";
    }
  };

  const timeDisplay = getTimeDisplay();

  return (
    <div className="rounded-3xl border border-zinc-200 bg-white p-6 flex flex-col h-full">
      <div className="flex items-center gap-4 mb-4">
        {avatar ? (
          <img
            src={avatar}
            alt={creator}
            className="h-12 w-12 rounded-full object-cover shadow-sm"
          />
        ) : (
          <div className="h-12 w-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-700 font-semibold text-sm">
            {creator
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)
              .toUpperCase()}
          </div>
        )}
        <div className="flex-1">
          <h3 className="font-semibold text-zinc-900">{name}</h3>
          <p className="text-sm text-zinc-500">by {creator}</p>
        </div>
        <span className="rounded-full bg-none border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-600">
          {category}
        </span>
      </div>

      {description && (
        <p className="text-sm text-zinc-600 mb-4 line-clamp-2">{description}</p>
      )}

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="font-medium text-zinc-900">{raised}</span>
          <span className="text-zinc-500">{target}</span>
        </div>
        <div className="w-full bg-zinc-100 rounded-full h-2">
          <div
            className="bg-[#F2723B] h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs text-zinc-500 mt-1">{progress}% funded</p>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 text-sm text-zinc-500">
          <Clock className="h-4 w-4" />
          <span>{timeDisplay}</span>
        </div>
        <Link
          href={`/iros/${id}`}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            status === "LIVE"
              ? "bg-[#F2723B] text-white hover:bg-[#F2723B]/80"
              : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
          }`}
        >
          {status === "LIVE" ? "Participate" : "View Details"}
        </Link>
      </div>
    </div>
  );
}
