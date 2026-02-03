"use client";

import Link from "next/link";
import { usePrivy } from "@privy-io/react-auth";

const CTAButton = ({ fullWidth = false }: { fullWidth?: boolean }) => {
  const { ready, authenticated, login } = usePrivy();

  const className = `${
    fullWidth ? "w-full text-center" : "px-5"
  } bg-linear-to-t from-zinc-800 to-zinc-700 border border-zinc-700 hover:from-zinc-900 hover:to-zinc-800 font-semibold text-white py-2 rounded-full transition-all duration-300 inline-block cursor-pointer`;

  if (!ready) return null;

  if (authenticated) {
    return (
      <Link href="/dashboard" className={className}>
        Dashboard
      </Link>
    );
  }

  return (
    <button onClick={login} className={className}>
      Login
    </button>
  );
};

export default CTAButton;
