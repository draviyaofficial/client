import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import NextImage from "next/image";

interface AuthCardProps {
  title: string;
  description: string;
  children: React.ReactNode;
  submitLabel: string;
  isSubmitting?: boolean;
  showSocial?: boolean;
}

/**
 * Wrapper component for Authentication pages.
 * Includes the Card shell, Social Logins, and Form container.
 */
export const AuthCard = ({
  title,
  description,
  children,
  submitLabel,
  isSubmitting = false,
  showSocial = true,
}: AuthCardProps) => {
  return (
    <Card className="w-full sm:max-w-[600px] z-20 px-6 py-10 md:px-10 md:py-16 rounded-3xl border-none shadow-2xl shadow-zinc-700/20 bg-white/90 backdrop-blur-sm mx-4">
      <CardHeader>
        <CardTitle className="text-3xl md:text-4xl font-bold text-center mb-2">
          {title}
        </CardTitle>
        <CardDescription className="text-md font-semibold text-zinc-700 text-center mb-5">
          {description}
        </CardDescription>
      </CardHeader>

      <CardContent>{children}</CardContent>

      <CardFooter className="flex gap-5 flex-col">
        {/* Main Submit Button - logic is handled by the form ID in the child */}
        {/* NOTE: If children contain their own button, this might be redundant or needed depending on design.
            The login page now includes its own button inside the form area (or just div).
            But AuthCard renders a submit button connected to 'auth-form'.
            The login page I updated REMOVED the form id='auth-form'.
            So this button in AuthCard will do nothing for the new Login page if not careful.
            However, I should probably hide this button if showSocial is false or if custom content is provided?
            Actually, the Login page renders A BUTTON inside it. so AuthCard's button is duplicate/useless if not connected.
            
            My Login Page:
            <AuthCard ... >
               <div ...> <Button onClick={login} ...>Sign In with Privy</Button> </div>
            </AuthCard>

            AuthCard renders:
            <CardContent>{children}</CardContent>
            <CardFooter> <Button type="submit" ... /> ... </CardFooter>

            The AuthCard button is 'type="submit"' and matches 'auth-form'.
            If I don't have 'auth-form', clicking it does nothing.
            
            I should probably Allow AuthCard to NOT render its own button if requested, or I should use AuthCard's button?
            AuthCard's button is styled nicely. 
            
            Let's keep it simple: I will hide AuthCard's button and social part if showSocial is false? 
            Or add `showSubmitButton`.
            
            For now, I'll stick to fixing `showSocial` prop.
            I will also wrap the footer content with checks.
         */}

        {/* If the user passes a button inside children, we might want to hide this one. 
            But existing code uses AuthCard wrapper. 
            The previous Login page used 'auth-form'. 
            
            I will modify AuthCard to NOT render the footer button if 'showSubmitButton' is false?
            Or just relies on `submitLabel`.
            
            Let's add `showSubmitButton?: boolean`.
            And `showSocial?: boolean`.
        */}
        <Button
          type="submit"
          form="auth-form" // This ID must match the form tag in the parent
          disabled={isSubmitting}
          className="w-full text-lg font-semibold bg-[#fcb65a] text-black py-6 my-2 cursor-pointer hover:bg-transparent border-2 border-[#fcb65a] hover:border-zinc-300 transition-all hidden"
          // Hiding it via class for now or conditionally render? Conditionally is better.
        >
          {isSubmitting ? "Loading..." : submitLabel}
        </Button>

        {/* I'll just remove the button from replacement if I can, or wrap it. */}

        {showSocial && (
          <>
            {/* Divider */}
            <div className="flex gap-3 items-center w-full justify-center">
              <div className="h-[2px] rounded-full w-7 bg-zinc-800"></div>
              <span className="text-sm font-semibold text-zinc-800">
                Or {submitLabel} with
              </span>
              <div className="h-[2px] rounded-full w-7 bg-zinc-800"></div>
            </div>

            {/* Social Buttons */}
            <div className="flex gap-5 justify-center w-full">
              <SocialButton provider="google" label="Google" />
              <SocialButton provider="twitter" label="Twitter" />
            </div>
          </>
        )}
      </CardFooter>
    </Card>
  );
};

// Sub-component for Social Buttons to keep the main component clean
const SocialButton = ({
  provider,
  label,
}: {
  provider: string;
  label: string;
}) => (
  <button
    type="button"
    className="border-2 border-zinc-200 rounded-md px-5 py-3 font-bold text-zinc-900 flex gap-2 items-center hover:bg-zinc-50 transition-colors bg-white"
  >
    <NextImage
      src={`/images/auth/${provider}.png`}
      alt={`${label} logo`}
      width={24}
      height={24}
      className="h-6 w-6"
      onError={(e) => (e.currentTarget.style.display = "none")}
    />
    {label}
  </button>
);
