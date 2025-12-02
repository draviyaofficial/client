"use client";

import { useState } from "react";
import Link from "next/link";
import { FaArrowRight } from "react-icons/fa6";
import { motion, AnimatePresence } from "motion/react";

const FAQ_ITEMS = [
  {
    id: "01",
    question: "How do creators actually make money here?",
    answer:
      "Creators earn real funding the moment they launch their IPO—fans buy their first batch of tokens at a fixed price, and a portion of that sale goes directly to the creator. After that, ongoing trading on the bonding curve generates steady revenue as the creator’s token gets more demand. It’s basically a modern, transparent way for creators to raise capital and build long-term financial upside.",
  },
  {
    id: "02",
    question: "Do I need to know finance to invest in creator tokens?",
    answer:
      "Nope. The platform handles all the complicated economics for you. The bonding curve automatically sets the price based on demand, so you don’t have to analyze charts or understand supply mechanics. Just choose the creators you believe in, tap buy or sell, and the smart contract does the rest—clean, simple, no finance degree needed.",
  },
  {
    id: "03",
    question: "Is it easy to buy and sell creator tokens?",
    answer:
      "Yes—ridiculously easy. Every creator token has its own on-chain reserve pool, which means trades happen instantly without waiting for a buyer or seller on the other side. No order books, no failed transactions, and no ‘pending’ nightmares. You always get a fair, algorithmically-set price the moment you click.",
  },
  {
    id: "04",
    question: "What happens if a creator grows or goes viral?",
    answer:
      "When a creator blows up—new video, trending collab, viral moment—fans start buying their token. More demand pushes the price up automatically along the bonding curve. Early believers benefit from that growth, the creator gets more visibility, and the whole ecosystem reacts in real time. It’s like a market that mirrors creator momentum perfectly.",
  },
  {
    id: "05",
    question: "How safe is the platform for creators and fans?",
    answer:
      "All pricing, trading, minting, and burning is handled entirely by audited smart contracts. No one manually controls the price, no one can manipulate liquidity, and all funds sit in transparent on-chain reserves. You always know where your money is and how the system works—no shady switches, no hidden rules.",
  },
  {
    id: "06",
    question: "Can any creator launch their own token?",
    answer:
      "Creators can’t just show up and drop a token—we verify them first. This keeps the platform high-quality, prevents low-effort cash grabs, and ensures fans are investing in real, active creators. Once approved, creators get their own IPO and bonding curve market, giving them a clean, professional launch experience.",
  },
];

const FAQ = () => {
  const [open, setOpen] = useState(0);

  return (
    <section className="w-dvw h-fit px-40 my-40 overflow-x-hidden">
      {/* Top Row */}
      <div className="flex justify-between w-full">
        <h3 className="text-6xl font-medium text-zinc-900 leading-tight">
          Got questions?
          <br />
          We've got answers.
        </h3>

        <div className="flex flex-col gap-10 max-w-md text-right">
          <p className="text-xl text-zinc-600">
            Here’s everything you need to know before getting started.
          </p>

          <Link
            href=""
            className="text-[#FF2F00] text-lg font-semibold flex gap-3 items-center justify-end"
          >
            <span>Contact us</span>
            <FaArrowRight className="h-5 w-5 -rotate-45" />
          </Link>
        </div>
      </div>

      {/* FAQ List */}
      <div className="mt-20 space-y-5 w-full">
        {FAQ_ITEMS.map((item, index) => {
          const isOpen = open === index;

          return (
            <div
              key={index}
              className="border border-orange-300 rounded-2xl p-6 transition-all bg-white shadow-sm"
            >
              {/* Question Button */}
              <button
                className="w-full flex items-center justify-between cursor-pointer"
                onClick={() => setOpen(isOpen ? -1 : index)}
              >
                <div className="flex items-center gap-5">
                  {/* Number Badge */}
                  <span className="h-10 w-10 flex items-center justify-center bg-orange-100 text-orange-600 rounded-full font-medium text-sm">
                    {item.id}
                  </span>

                  <span className="text-lg font-medium text-zinc-900">
                    {item.question}
                  </span>
                </div>

                {/* Plus / Minus Icon with animation */}
                <motion.span
                  key={isOpen ? "minus" : "plus"}
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="text-[#FF2F00] text-3xl leading-none select-none"
                >
                  {isOpen ? "−" : "+"}
                </motion.span>
              </button>

              {/* Answer with smooth animation */}
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0, y: -4 }}
                    animate={{ height: "auto", opacity: 1, y: 0 }}
                    exit={{ height: 0, opacity: 0, y: -4 }}
                    transition={{ duration: 0.35, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <p className="mt-4 text-zinc-600 leading-relaxed pb-3">
                      {item.answer}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default FAQ;
