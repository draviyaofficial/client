import { useMemo } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useQuery } from "@tanstack/react-query";
import { fetchMeFn } from "../api/mutations";
import { User } from "../types";

export const useUser = () => {
  const { user, ready, authenticated, getAccessToken } = usePrivy();

  const { data: dbUser, isLoading: isDbLoading } = useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const token = await getAccessToken();
      if (!token) return null;
      return fetchMeFn(token);
    },
    enabled: authenticated && ready,
  });

  const adaptedUser: User | null = useMemo(() => {
    if (dbUser) {
      return {
        ...dbUser,
        // Ensure strictly required fields from Privy if missing in DB (fallback mainly)
        externalAuthId: dbUser.externalAuthId || user?.id || "",
        email: dbUser.email || user?.email?.address || "",
        walletAddress: dbUser.walletAddress || user?.wallet?.address,
        // Use DB name if present, otherwise no fallback to avoid "User" or email
        name:
          (dbUser.firstName ? `${dbUser.firstName} ` : "") +
            (dbUser.lastName || "") || undefined,
      };
    }

    // Fallback to Privy user if DB user fetch fails or is loading
    return user
      ? {
          id: user.id,
          externalAuthId: user.id,
          email: user.email?.address || "",
          name: user.google?.name || user.twitter?.name || undefined,
          role: "user",
          walletAddress: user.wallet?.address,
        }
      : null;
  }, [user, dbUser]);

  return {
    data: adaptedUser,
    isLoading: !ready || (authenticated && isDbLoading),
    isError: false,
  };
};
