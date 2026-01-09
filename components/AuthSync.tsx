"use client";

import { useEffect, useRef } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useMutation } from "@tanstack/react-query";
import { syncUserFn } from "@/services/auth/model/api/mutations";

export default function AuthSync() {
  const { user, ready, authenticated, getAccessToken } = usePrivy();
  const hasSynced = useRef(false);

  const { mutate: syncUser } = useMutation({
    mutationFn: async () => {
      const token = await getAccessToken();
      if (!token) throw new Error("No token");

      const email = user?.email?.address;
      const walletAddress = user?.wallet?.address;
      const privyId = user?.id;

      if (!privyId) throw new Error("No user ID");

      return syncUserFn(
        {
          privyId,
          email,
          walletAddress,
        },
        token
      );
    },
    onSuccess: (data) => {
      console.log("User synced:", data);
    },
    onError: (error) => {
      console.error("Sync error:", error);
    },
  });

  useEffect(() => {
    if (ready && authenticated && user) {
      if (!hasSynced.current) {
        hasSynced.current = true;
        syncUser();
      }
    } else if (!authenticated) {
      hasSynced.current = false;
    }
  }, [ready, authenticated, user, syncUser]);

  return null;
}
