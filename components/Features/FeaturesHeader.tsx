import React from "react";

const FeaturesHeader: React.FC = () => {
  return (
    <div className="flex justify-between py-40">
      <h3 className="text-white text-5xl font-medium max-w-[700px]">
        A market where creators rise—and your wallet doesn’t get left behind.
      </h3>

      <div className="flex flex-col gap-10 max-w-[600px]">
        <p className="text-zinc-400 text-lg">
          We’re building a decentralized exchange where creators launch their
          own tokens through an IPO and trade with guaranteed liquidity via a
          bonding curve. This lets fans invest directly in creators’ growth
          while giving creators a sustainable, community-driven monetization
          system.
        </p>

        <button
          type="button"
          className="w-fit bg-linear-to-t from-zinc-900 to-zinc-700 border border-t-zinc-500 hover:from-zinc-900 hover:to-zinc-800 border-zinc-700 font-semibold text-white px-7 py-3 rounded-full transition-all duration-300"
        >
          Join the revolution
        </button>
      </div>
    </div>
  );
};

export default FeaturesHeader;
