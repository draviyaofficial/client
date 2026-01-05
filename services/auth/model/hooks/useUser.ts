import { usePrivy } from "@privy-io/react-auth";
import { User } from "../types";

export const useUser = () => {
  const { user, ready } = usePrivy();

  const adaptedUser: User | null = user
    ? {
        id: user.id,
        email: user.email?.address || "",
        name:
          user.google?.name ||
          user.twitter?.name ||
          user.email?.address ||
          "User",
        role: "user",
      }
    : null;

  return {
    data: adaptedUser,
    isLoading: !ready,
    isError: false,
  };
};
