"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { useState, useEffect } from "react";

const NAV_ITEMS = [
  { title: "Resources", link: "/resources" },
  { title: "About", link: "/about" },
  { title: "Connect", link: "/connect" },
];

const Navbar = () => {
  // Whether navbar container should be visible
  const [isVisible, setIsVisible] = useState(true);

  // Previous scroll Y position
  const [lastScrollY, setLastScrollY] = useState(0);

  // Tracks how much user scrolls in a single direction
  const [scrollDelta, setScrollDelta] = useState(0);

  // Scroll distance required before hiding navbar
  const scrollThreshold = 120;

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollDifference = currentScrollY - lastScrollY;

      // -----------------------------
      // TRACK SCROLL DIRECTION + DELTA
      // -----------------------------
      // If scrolling in the same direction → accumulate delta
      // If direction changes → reset delta to start fresh
      const newScrollDelta =
        (scrollDelta >= 0 && scrollDifference > 0) ||
        (scrollDelta <= 0 && scrollDifference < 0)
          ? scrollDelta + scrollDifference
          : scrollDifference;

      setScrollDelta(newScrollDelta);

      // -----------------------------
      // LOGIC TO SHOW / HIDE NAVBAR
      // -----------------------------
      // When near the top → navbar should always show
      if (currentScrollY < 50) {
        setIsVisible(true);
        setScrollDelta(0);
      }
      // Hide navbar after scrolling down continuously past threshold
      else if (newScrollDelta > scrollThreshold && currentScrollY > 150) {
        setIsVisible(false);
      }
      // Show navbar if user scrolls up even a little
      else if (
        newScrollDelta < -50 ||
        (scrollDifference < 0 && currentScrollY > 50)
      ) {
        setIsVisible(true);
        setScrollDelta(0);
      }

      // Update last known scroll position
      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY, scrollDelta, scrollThreshold]);

  return (
    <div className="w-dvw h-[100px] flex items-center justify-center fixed top-0 left-0 z-9999">
      {/* ---------------------------------------
          NAVBAR CONTAINER (Animated show/hide)
      ---------------------------------------- */}
      <motion.div
        initial={{ scaleX: 0, scaleY: 0, opacity: 0 }}
        animate={{
          scaleX: isVisible ? 1 : 0,
          scaleY: isVisible ? 1 : 0,
          opacity: isVisible ? 1 : 0,
        }}
        transition={{
          scaleX: {
            duration: 0.8,
            ease: [0.23, 1, 0.32, 1],
            delay: isVisible ? 0 : 0.3, // Delay shrinking after fade-out
          },
          scaleY: {
            duration: 0.8,
            ease: [0.23, 1, 0.32, 1],
            delay: isVisible ? 0 : 0.3,
          },
          opacity: {
            duration: isVisible ? 0.8 : 0.5, // Faster fade on hide
            ease: [0.23, 1, 0.32, 1],
            delay: isVisible ? 0 : 0.3,
          },
        }}
        className="border border-zinc-700 w-fit h-fit py-3 px-7 rounded-full bg-black flex justify-between gap-32 shadow-2xl shadow-zinc-800 origin-center overflow-hidden"
      >
        {/* ---------------------------------------
            LOGO + ICON (Fades in/out)
        ---------------------------------------- */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: isVisible ? 1 : 0 }}
          transition={{
            delay: isVisible ? 0.3 : 0, // Slight delay when appearing
            duration: 0.4,
            ease: [0.23, 1, 0.32, 1],
          }}
          className="flex gap-2 items-center"
        >
          <img
            src="/images/logo/logo-icon.jpeg"
            alt=""
            className="h-8 rounded-md"
          />
          <img src="/images/logo/logo-name.jpeg" alt="" className="h-6" />
        </motion.div>

        {/* ---------------------------------------
            NAV LINKS + CTA
        ---------------------------------------- */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: isVisible ? 1 : 0 }}
          transition={{
            delay: isVisible ? 0.5 : 0, // Links fade in last
            duration: 0.4,
            ease: [0.23, 1, 0.32, 1],
          }}
          className="flex gap-10"
        >
          {/* ----- Navigation Links ------ */}
          <div className="flex gap-5 items-center font-semibold">
            {NAV_ITEMS.map((item, key) => (
              <motion.div
                key={key}
                className="relative"
                whileHover="hover"
                initial="default"
              >
                <Link href={item.link} className="block">
                  <div className="text-white cursor-pointer">{item.title}</div>

                  {/* Underline hover animation */}
                  <motion.div
                    className="absolute bottom-0 left-0 h-[2px] bg-white"
                    variants={{
                      default: { width: 0 },
                      hover: { width: "100%" },
                    }}
                    transition={{
                      duration: 0.5,
                      ease: [0.23, 1, 0.32, 1],
                    }}
                  />
                </Link>
              </motion.div>
            ))}
          </div>

          {/* ----- CTA Button ------ */}
          <button
            type="button"
            className="bg-linear-to-t from-zinc-800 to-zinc-700 border cursor-pointer hover:from-zinc-900 hover:to-zinc-800 border-zinc-700 font-semibold text-white px-5 py-2 rounded-full transition-all duration-300 relative z-50"
          >
            Join the revolution
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Navbar;
