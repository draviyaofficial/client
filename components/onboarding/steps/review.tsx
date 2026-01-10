"use client";

import React from "react";
import { useFormContext } from "react-hook-form";
import { OnboardingFormData } from "@/lib/schemas/onboarding-schema";
import { User, Share2, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

// Helper for displaying a label-value row
const ReviewRow = ({
  label,
  value,
  className,
}: {
  label: string;
  value: React.ReactNode;
  className?: string;
}) => (
  <div
    className={cn(
      "flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 border-b border-zinc-100 last:border-0 gap-1",
      className
    )}
  >
    <span className="text-zinc-500 text-sm">{label}</span>
    <span className="text-zinc-900 font-medium text-sm text-right break-words max-w-full sm:max-w-[60%]">
      {value || <span className="text-zinc-300 italic">Not provided</span>}
    </span>
  </div>
);

// Helper for Section Cards
const ReviewSection = ({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: any;
  children: React.ReactNode;
}) => (
  <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-zinc-200 shadow-sm">
    <div className="flex items-center gap-2 mb-4 border-b border-zinc-100 pb-3">
      <div className="p-2 bg-[#f9efe3] rounded-full text-[#f1a13e]">
        <Icon size={16} />
      </div>
      <h3 className="font-bold text-zinc-800">{title}</h3>
    </div>
    <div className="space-y-1">{children}</div>
  </div>
);

const StepReview = () => {
  // We use watch() to get real-time data from the form context
  const { watch } = useFormContext<OnboardingFormData>();
  const data = watch();

  return (
    <div className="space-y-6">
      {/* 1. Identity Section */}
      <ReviewSection title="Creator Identity" icon={User}>
        <ReviewRow label="Full Name" value={data.fullName} />
        <ReviewRow label="Phone" value={data.phoneNumber} />
        <ReviewRow
          label="Bio"
          value={data.bio}
          className="flex-col sm:items-start sm:text-left"
        />
      </ReviewSection>

      {/* 2. Socials */}
      <ReviewSection title="Social Connections" icon={Share2}>
        {data.socials && data.socials.length > 0 ? (
          data.socials.map((social, index) => (
            <div
              key={index}
              className="flex justify-between items-center py-2 border-b border-zinc-100 last:border-0"
            >
              <span className="capitalize text-zinc-500 text-sm flex items-center gap-2">
                {social.platform}
              </span>
              <a
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 text-sm font-medium flex items-center gap-1 hover:underline"
              >
                {social.handle} <ExternalLink size={12} />
              </a>
            </div>
          ))
        ) : (
          <p className="text-zinc-400 text-sm italic">No socials linked.</p>
        )}
      </ReviewSection>
    </div>
  );
};

export default StepReview;
