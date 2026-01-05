"use client";

import React, { useEffect } from "react";
import { AuthCard } from "@/components/auth/auth-card";
import { useAuth } from "@/services/auth/model/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

const LoginPage = () => {
  const { login, isLoggingIn, isAuthenticated, ready } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (ready && isAuthenticated) {
      router.push("/dashboard");
    }
  }, [ready, isAuthenticated, router]);

  return (
    <AuthCard
      title="Login"
      description="Welcome back! Sign in to continue."
      submitLabel="Sign In"
      isSubmitting={isLoggingIn}
      showSocial={false} // Assuming AuthCard handles this, or effectively hiding the form
    >
      <div className="flex flex-col gap-4">
        <Button onClick={login} disabled={isLoggingIn} className="w-full">
          {isLoggingIn ? "Signing in..." : "Sign In with Privy"}
        </Button>
      </div>
    </AuthCard>
  );
};

export default LoginPage;
