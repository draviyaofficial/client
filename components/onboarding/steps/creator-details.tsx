import { useFormContext } from "react-hook-form";
import { OnboardingFormData } from "@/lib/schemas/onboarding-schema";
import { CustomFormField } from "@/components/ui/custom-form-field";

export const StepCreatorDetails = () => {
  const { control } = useFormContext<OnboardingFormData>();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <CustomFormField
          control={control}
          name="fullName"
          label="Full Name"
          placeholder="e.g. Jane Doe"
        />
        <CustomFormField
          control={control}
          name="email"
          label="Email Address"
          placeholder="jane@example.com"
        />
        <CustomFormField
          control={control}
          name="phoneNumber"
          label="Phone Number"
          placeholder="+1234567890"
        />
      </div>

      <CustomFormField
        control={control}
        name="bio"
        label="Bio"
        fieldType="textarea"
        placeholder="Tell your story..."
        description="Min 50 characters"
      />
    </div>
  );
};
