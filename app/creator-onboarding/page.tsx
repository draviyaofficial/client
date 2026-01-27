"use client";

import React, { useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "motion/react";
import { User, Share2, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner"; // Assuming you have sonner installed

// Imports from our refactored structure
import { OnboardingSidebar } from "@/components/onboarding/sidebar";
import { StepCreatorDetails } from "@/components/onboarding/steps/creator-details";
import { StepSocials } from "@/components/onboarding/steps/socials";
import {
  onboardingSchema,
  OnboardingFormData,
  step1Schema,
  step3Schema,
} from "@/lib/schemas/onboarding-schema";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Controller } from "react-hook-form";
import StepReview from "@/components/onboarding/steps/review";

// Configuration for steps
const STEPS = [
  {
    id: 1,
    title: "Creator Identity",
    description:
      "Tell us who you are, what you make, and why people should care.",
    longDescription:
      "Share your basic info, creator handle, bio, and category. This helps us verify you're a real creator and sets the foundation for your token launch.",
    icon: User,
    schema: step1Schema,
  },
  {
    id: 2,
    title: "Social Proof",
    description: "Connect your real audience — show us the clout.",
    longDescription:
      "Link your social platforms so we can verify your creator presence. This helps fans trust your token and ensures your IPO reaches the right people.",
    icon: Share2,
    schema: step3Schema,
  },
  {
    id: 3,
    title: "Final Review",
    description: "Look everything over before going live.",
    longDescription:
      "Confirm all your details, approve your information, and verify content ownership. Once you're ready, your IPO setup moves into the approval pipeline.",
    icon: CheckCircle2,
    schema: null,
  },
];

import { usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import NextImage from "next/image";
import { createApplicationFn } from "@/services/auth/model/api/mutations";

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { getAccessToken } = usePrivy();
  const router = useRouter();

  // 1. Initialize Form with Combined Schema
  const methods = useForm<OnboardingFormData>({
    resolver: zodResolver(onboardingSchema),
    mode: "onChange",
    defaultValues: {
      socials: [{ platform: "twitter", handle: "", url: "" }],
      contentOwnershipDeclared: undefined,
      phoneNumber: "",
      email: "",
      fullName: "",
      bio: "",
    },
  });

  const {
    trigger,
    handleSubmit,
    control,
    formState: { errors },
  } = methods;

  // 2. Navigation Logic
  const nextStep = async () => {
    const stepConfig = STEPS[currentStep - 1];

    // Only validate fields relevant to the current step
    // If schema is null (last step), we skip specific validation here
    let valid = true;
    if (stepConfig.schema) {
      const keys = stepConfig.schema.keyof().options; // Get keys from Zod schema
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      valid = await trigger(keys as unknown as any);
    }

    if (valid) setCurrentStep((prev) => Math.min(prev + 1, STEPS.length));
  };

  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  // 3. Submission Logic
  const onSubmit = async (data: OnboardingFormData) => {
    setIsSubmitting(true);
    try {
      const token = await getAccessToken();
      if (!token) {
        toast.error("You must be logged in to submit an application");
        return;
      }

      await createApplicationFn(
        {
          name: data.fullName,
          description: data.bio,
          contactNumber: data.phoneNumber!, // Validated by schema to be present
          emailAddress: data.email,
          socials: data.socials,
        },
        token,
      );

      toast.success("Application Submitted successfully!");
      router.push("/dashboard"); // Redirect after success
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error(error);
      const message =
        error instanceof Error ? error.message : "Failed to submit application";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    // Wrap everything in FormProvider so children can use useFormContext
    <FormProvider {...methods}>
      <div className="flex h-screen w-full font-sans text-slate-900 p-10 bg-[#f9efe3] overflow-hidden">
        <NextImage
          className="masked-img absolute top-0 left-0 object-cover"
          src="/images/hero/hero-image.jpg"
          alt="Hero Background"
          fill
        />
        <OnboardingSidebar steps={STEPS} currentStep={currentStep} />

        <main className="flex-1 flex flex-col relative overflow-y-auto">
          <div className="max-w-2xl mx-auto w-full p-6 lg:p-12 lg:pt-24 flex flex-col flex-1">
            {/* Header */}
            <div className="mb-8">
              <span className="text-[#f1a13e] font-bold text-xs uppercase tracking-wide">
                Step {currentStep} / {STEPS.length}
              </span>
              <h2 className="text-4xl font-bold my-2">
                {STEPS[currentStep - 1].title}
              </h2>
              <p className="text-zinc-600 text-md mb-10">
                {STEPS[currentStep - 1].longDescription}
              </p>
            </div>

            <form
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-6 flex-1 flex flex-col"
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                  className="flex-1"
                >
                  {/* Step Switcher */}
                  {currentStep === 1 && <StepCreatorDetails />}

                  {currentStep === 2 && <StepSocials />}

                  {currentStep === 3 && (
                    <div className="space-y-8">
                      {/* 1. The Overview Component */}
                      <StepReview />

                      {/* 2. The Final Declaration Checkbox */}
                      <div className="flex items-start space-x-3 p-4 border rounded-lg bg-[#fbdeb8]">
                        <Controller
                          control={control}
                          name="contentOwnershipDeclared"
                          render={({ field }) => (
                            <Checkbox
                              id="terms"
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              className="bg-white/50 border-zinc-400 data-[state=checked]:bg-zinc-900 data-[state=checked]:text-white"
                            />
                          )}
                        />
                        <div className="grid gap-1.5 leading-none">
                          <label
                            htmlFor="terms"
                            className="text-sm font-bold text-zinc-900 leading-none cursor-pointer"
                          >
                            Ownership Declaration
                          </label>
                          <p className="text-sm text-zinc-700">
                            I declare that I own the content associated with
                            this profile and agree to the Terms of Service.
                          </p>
                        </div>
                      </div>

                      {/* Error Message for Checkbox */}
                      {errors.contentOwnershipDeclared && (
                        <p className="text-red-500 text-sm text-center font-medium bg-red-50 p-2 rounded-md border border-red-100">
                          {errors.contentOwnershipDeclared.message}
                        </p>
                      )}
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Navigation Footer */}
              <div className="pt-8 flex justify-between items-center mt-auto">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={prevStep}
                  disabled={currentStep === 1 || isSubmitting}
                  className={
                    currentStep === 1
                      ? "invisible"
                      : "cursor-pointer border-2 border-zinc-200 rounded-md px-7 py-5 font-bold text-zinc-900 flex gap-2 items-center hover:bg-zinc-50 transition-colors bg-white"
                  }
                >
                  Go Back
                </Button>

                {currentStep < STEPS.length ? (
                  <Button
                    type="button"
                    onClick={nextStep}
                    className="cursor-pointer px-5 py-2 md:px-7 md:py-5 bg-[#fcb65a] rounded-md font-semibold text-zinc-900 border-2 border-[#fcb65a] hover:bg-transparent hover:border-zinc-300 transition-all text-sm md:text-base"
                  >
                    Continue
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="cursor-pointer min-w-[140px] px-5 py-2 md:px-7 md:py-5 bg-[#fcb65a] rounded-md font-semibold text-zinc-900 border-2 border-[#fcb65a] hover:bg-transparent hover:border-zinc-300 transition-all text-sm md:text-base"
                  >
                    {isSubmitting ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      "Submit Application"
                    )}
                  </Button>
                )}
              </div>
            </form>
          </div>
        </main>
      </div>
    </FormProvider>
  );
}
