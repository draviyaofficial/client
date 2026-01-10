"use client";

import React, { useEffect } from "react";
import { AuthCard } from "@/components/auth/auth-card";
import { useAuth } from "@/services/auth/model/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useUser } from "@/services/auth/model/hooks/useUser";

const AdminLoginPage = () => {
  const { login, isLoggingIn, isAuthenticated, ready, logout } = useAuth();
  const { data: user, isLoading: isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (ready && isAuthenticated && !isUserLoading) {
      if (user?.role === "ADMIN") {
        router.push("/admin/dashboard");
      } else if (user) {
        toast.error("Access Denied. Admins only.");
        logout(); // Log out non-admin users trying to access admin
      }
    }
  }, [ready, isAuthenticated, router, user, isUserLoading, logout]);

  return (
    <AuthCard
      title="Admin Portal"
      description="Authorized personnel only."
      submitLabel="Admin Login"
      isSubmitting={isLoggingIn}
      showSocial={false}
    >
      <div className="flex flex-col gap-4">
        <Button
          onClick={login}
          disabled={isLoggingIn}
          className="w-full bg-red-600 hover:bg-red-700 text-white"
        >
          {isLoggingIn ? "Verifying..." : "Authenticate as Admin"}
        </Button>
      </div>
    </AuthCard>
  );
};

export default AdminLoginPage;
