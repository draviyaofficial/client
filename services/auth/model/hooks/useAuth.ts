import { usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";

export const useAuth = () => {
  const { login, logout, ready, authenticated } = usePrivy();
  const router = useRouter();

  const handleLogin = () => {
    login();
  };

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  return {
    login: handleLogin,
    logout: handleLogout,
    ready,
    isLoggingIn: !ready,
    isAuthenticated: authenticated,
    isLoggingOut: false,
    // Maintaining some compatibility or empty states for removed features
    isRegistering: false,
    register: () => {},
    loginError: null,
    registerError: null,
  };
};
