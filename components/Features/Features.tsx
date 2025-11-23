import React from "react";
import FeaturesHeader from "./FeaturesHeader";
import FeatureCard from "./FeatureCard";
import Tagline from "./Tagline";
import MiniCardSection from "./MiniCardSection";

interface FeatureItem {
  title: string;
  desc: string;
  img: string;
  icon: string;
}

const FEATURES_DATA: FeatureItem[] = [
  {
    title: "Sustainable Creator Earnings",
    desc: "Creators earn from their initial token sale and continued market activity, giving them a predictable and transparent monetization channel beyond ads or brand deals.",
    img: "/images/features/bitcoin.png",
    icon: "/images/features/earning.png",
  },
  {
    title: "Fan Investment & Trading",
    desc: "Fans can invest in creators they believe in, buy and sell tokens anytime, and track real-time price movements driven by market sentiment.",
    img: "/images/features/portfolio.png",
    icon: "/images/features/trading.png",
  },
  {
    title: "Creator IPO Launch",
    desc: "Creators can launch their own tokens through a fixed-price IPO, establishing their initial valuation and raising capital directly from their community.",
    img: "/images/features/ipo.png",
    icon: "/images/features/rocket.png",
  },
  {
    title: "Guaranteed Liquidity via Bonding Curve",
    desc: "All token trading happens through an automated bonding-curve market maker, ensuring instant buy/sell execution without needing external liquidity providers.",
    img: "/images/features/tbc.png",
    icon: "/images/features/curve.png",
  },
];

const Features: React.FC = () => {
  return (
    <section className="p-10 w-dvw mt-20">
      <div className="h-fit w-full bg-[#0F0F0F] rounded-4xl px-20">
        <FeaturesHeader />

        {/* Grid of Feature Cards */}
        <div className="border-6 border-zinc-900 rounded-4xl grid grid-cols-2 w-full mb-10 p-2 gap-2">
          {FEATURES_DATA.map((item, idx) => (
            <FeatureCard key={idx} {...item} />
          ))}
        </div>

        {/* Center Showcase */}
        <Tagline />

        {/* Mini Feature Cards */}
        <MiniCardSection />
      </div>
    </section>
  );
};

export default Features;
