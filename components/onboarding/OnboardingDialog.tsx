"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ArrowRight, Rocket, User } from "lucide-react";
import { useRouter } from "next/navigation";

interface OnboardingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OnboardingDialog({
  open,
  onOpenChange,
}: OnboardingDialogProps) {
  const router = useRouter();

  const handleChoice = (path: string) => {
    onOpenChange(false);
    router.push(path);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl bg-white border-zinc-200 text-zinc-900 p-0 overflow-hidden shadow-2xl">
        <div className="relative z-10 p-12 space-y-10">
          <DialogHeader className="text-center space-y-4">
            <DialogTitle className="text-4xl font-bold tracking-tight text-zinc-900">
              Welcome to Draviya
            </DialogTitle>
            <DialogDescription className="text-zinc-500 text-lg max-w-lg mx-auto">
              Choose your journey to get started. You can always engage in both
              roles later.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Creator Path */}
            <div
              onClick={() => handleChoice("/creator-onboarding")}
              className="group cursor-pointer rounded-2xl bg-zinc-50 border border-zinc-200/50 p-8 hover:bg-white hover:border-zinc-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden"
            >
              <div className="space-y-6 relative z-10">
                <div className="p-4 w-fit rounded-xl bg-indigo-50 text-indigo-600 group-hover:bg-[#F2723B] group-hover:text-white transition-colors duration-300 shadow-xs">
                  <Rocket className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-zinc-900 mb-3 group-hover:text-[#F2723B] transition-colors">
                    Onboard as Creator
                  </h3>
                  <p className="text-base text-zinc-500 leading-relaxed group-hover:text-zinc-600">
                    Launch your own token, raise funds via IRO, and build your
                    community.
                  </p>
                </div>
                <div className="pt-2 flex items-center text-sm font-semibold text-indigo-600 group-hover:text-[#F2723B] transition-colors">
                  Start Launching{" "}
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>

            {/* User Path */}
            <div
              onClick={() => handleChoice("/dashboard")}
              className="group cursor-pointer rounded-2xl bg-zinc-50 border border-zinc-200/50 p-8 hover:bg-white hover:border-zinc-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden"
            >
              <div className="space-y-6 relative z-10">
                <div className="p-4 w-fit rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300 shadow-xs">
                  <User className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-zinc-900 mb-3 group-hover:text-blue-600 transition-colors">
                    Explore as User
                  </h3>
                  <p className="text-base text-zinc-500 leading-relaxed group-hover:text-zinc-600">
                    Invest in creator tokens, manage your portfolio, and
                    discover new opportunities.
                  </p>
                </div>
                <div className="pt-2 flex items-center text-sm font-semibold text-blue-600 group-hover:text-blue-600 transition-colors">
                  Go to Dashboard{" "}
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
