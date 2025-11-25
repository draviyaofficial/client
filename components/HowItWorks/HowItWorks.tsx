"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";

const STEPS = [
  {
    title: "Creator IPO Launch",
    icon: "/images/howitworks/rocket.png",
    step_image: "/images/howitworks/step1.png",
    description:
      "Creators start by launching a fixed-price IPO where early supporters buy the first batch of tokens. This instantly gives creators real funding — a chunk of the IPO money goes straight into their treasury, while the rest fills the reserve vault that sets the starting price. It’s basically a creator’s “day one raise,” but without VCs or sketchy deals.",
  },
  {
    title: "Bonding Curve Market Engine",
    icon: "/images/howitworks/tbc.png",
    step_image: "/images/howitworks/step2.jpeg",
    description:
      "After the IPO wraps, the token upgrades to a bonding-curve smart contract that handles all the nerdy economics automatically. Every buy mints new tokens and pushes the price up; every sell burns tokens and brings the price down — all powered by the reserve the IPO created. The creator isn’t managing the market; the curve does the math so they can focus on creating content, not deciphering finance.",
  },
  {
    title: "Live Trading for Everyone",
    icon: "/images/howitworks/trading.png",
    step_image: "/images/howitworks/step3.jpeg",
    description:
      "Once the token hits the live market, anyone can buy, sell, or trade instantly with guaranteed liquidity. Fans build flex-worthy portfolios, creators gain long-term support as trading boosts their visibility, and the price moves in real time based purely on demand — no middlemen, no Wall Street chaos, just vibes and market forces.",
  },
];

const HowItWorks = () => {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const i = setInterval(
      () => setCurrentStep((prev) => (prev + 1) % STEPS.length),
      10000
    );
    return () => clearInterval(i);
  }, []);

  return (
    <section className="w-dvw my-40 px-10 flex h-fit">
      {/* LEFT SIDE */}
      <div className="h-full w-[47%] p-12 flex flex-col gap-20">
        <h3 className="text-6xl text-zinc-900 font-medium">
          <span className="text-zinc-600">So… How Does This Whole Thing </span>
          Actually Work?
        </h3>

        <p className="text-zinc-500 text-lg font-semibold">
          Yes, it’s fully on-chain, yes, liquidity is instant, and no, you don’t
          have to understand bonding curves to use it like an absolute pro.
        </p>

        <div className="flex flex-col gap-5 pr-10 relative">
          {STEPS.map((step, index) => {
            const isActive = currentStep === index;

            return (
              <div
                key={index}
                className="px-7 py-5 rounded-xl flex gap-5 items-center relative overflow-hidden"
              >
                {/* Base highlight */}
                <motion.div
                  layoutId="highlight"
                  className={`absolute inset-0 ${
                    isActive ? "bg-orange-200" : "bg-zinc-500/20"
                  }  rounded-xl -z-10`}
                  transition={{ type: "spring", stiffness: 250, damping: 28 }}
                />

                {/* Overlay progress fill */}
                {isActive && (
                  <motion.div
                    key={currentStep}
                    className="absolute inset-0 bg-orange-400/70 -z-10 rounded-xl origin-left"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 10, ease: "linear" }}
                  />
                )}

                <img src={step.icon} className="h-7 w-7" />
                <span className="text-zinc-900 font-semibold">
                  {step.title}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* RIGHT SIDE (Untouched Original Layout) */}
      <div className="h-full w-[53%] rounded-4xl pt-12 relative">
        <img
          src="/images/howitworks/bg.png"
          className="w-full h-full rounded-4xl"
        />

        <motion.img
          key={STEPS[currentStep].step_image}
          src={STEPS[currentStep].step_image}
          className="absolute inset-0 top-24 mx-auto h-[350px] rounded-lg shadow-2xl shadow-zinc-200/60"
          initial={{ opacity: 0, y: 20, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.45 }}
        />

        <motion.div
          key={STEPS[currentStep].description}
          className="absolute inset-0 w-full h-full z-20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
          <p className="absolute text-white/60 p-16 font-medium bottom-0">
            {STEPS[currentStep].description}
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default HowItWorks;
