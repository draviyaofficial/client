import * as z from "zod";

// --- Sub-Schemas ---

export const step1Schema = z.object({
  fullName: z
    .string()
    .min(1, "Full name is required") // Ensures it's not empty
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Full name cannot exceed 100 characters"),

  email: z.string().email("Please enter a valid email address"),

  bio: z
    .string()
    .min(1, "Bio is required")
    .min(50, "Bio must be at least 50 characters to provide enough context")
    .max(500, "Bio cannot exceed 500 characters"),

  // Matches Server `contactNumber`
  phoneNumber: z
    .string()
    .min(10, "Phone number must be at least 10 digits")
    .max(15, "Phone number is too long"),
});

export const step3Schema = z.object({
  socials: z
    .array(
      z.object({
        platform: z.enum([
          "twitter",
          "instagram",
          "youtube",
          "tiktok",
          "linkedin",
          "facebook",
          "other",
        ]),
        handle: z
          .string()
          .min(1, "Social handle is required")
          .max(100, "Handle is too long"),
        url: z
          .string()
          .min(1, "URL is required")
          .url("Please enter a valid URL (e.g., https://twitter.com/user)")
          .max(500, "URL is too long"),
      })
    )
    .min(1, "Please link at least one social media account"),
});

export const step5Schema = z.object({
  // Logic: Must be boolean AND must be true
  contentOwnershipDeclared: z.boolean().refine((val) => val === true, {
    message: "You must declare content ownership and agree to terms to proceed",
  }),
});

// --- Combined Schema ---
export const onboardingSchema = step1Schema
  .merge(step3Schema)
  .merge(step5Schema);

export type OnboardingFormData = z.infer<typeof onboardingSchema>;
