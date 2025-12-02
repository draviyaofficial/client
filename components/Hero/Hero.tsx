"use client";

import HeroLogos from "./HeroLogos";
import { motion } from "motion/react";
import HeroText from "./HeroText";
import Link from "next/link";

const SOCIALS = [
  {
    title: "Twitter",
    icon: "/images/socials/twitter.png",
    link: "",
  },
  {
    title: "Instagram",
    icon: "/images/socials/instagram.png",
    link: "",
  },
  {
    title: "GitHub",
    icon: "/images/socials/github.png",
    link: "",
  },
];

const Hero = () => {
  return (
    <section className="relative h-fit w-dvw">
      {/* HERO TOP - Background + Floating Logos */}
      <div className="hero relative h-dvh w-dvw overflow-hidden">
        {/* Background image */}
        <img
          className="masked-img"
          src="/images/hero/hero-image.jpg"
          alt="Hero Background"
        />

        {/* Mask/Overlay */}
        <div className="hero-overlay" aria-hidden="true" />

        {/* Floating platform logos */}
        <HeroLogos />
      </div>

      {/* HERO CONTENT BELOW */}
      <div className="relative z-10 flex flex-col items-center justify-center w-full pt-60 gap-40">
        <HeroText text="Meet the World's First Creator Stock Exchange" />

        {/* Dashboard Animation */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            scale: {
              type: "spring",
              stiffness: 80,
              damping: 18,
              mass: 1.5,
            },
            opacity: {
              duration: 0.8,
              ease: [0.23, 1, 0.32, 1],
            },
          }}
          className="relative"
        >
          <img
            src="/images/hero/dashboard-img.png"
            alt="Dashboard"
            className="h-[300px] sm:h-[400px] md:h-[500px] lg:h-[700px] rounded-xl sm:rounded-2xl lg:rounded-4xl relative z-10"
          />

          {/* Glow after reveal */}
          <motion.div
            className="absolute inset-0 rounded-4xl pointer-events-none"
            style={{
              boxShadow: "1px -10px 80px -10px #f8532e",
              opacity: 0,
            }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 1 }}
          />
        </motion.div>
      </div>

      <div className="flex flex-col items-center justify-center my-30 gap-10">
        <h2 className="font-medium text-2xl text-center">
          You’ve been investing in creators emotionally.
          <br /> Try financially.
        </h2>
        <button
          type="button"
          className="text-xl border border-zinc-900 bg-linear-to-t from-[#FF2F00] to-[#f5775b] cursor-pointer hover:from-[#FF2F00] hover:to-[#FF2F00] font-semibold text-white px-7 py-3 rounded-full transition-all duration-300 relative z-50"
        >
          Join the revolution
        </button>
        <div className="flex flex-col gap-3 items-center">
          <div className="flex">
            {SOCIALS.map((social, index) => {
              const randomRotation = Math.random() * 20 - 10;

              return (
                <Link key={index} href={social.link}>
                  <div
                    className="p-3 border border-zinc-300 bg-white shadow-zinc-500 rounded-xl hover:-translate-y-2 duration-300 transition-all"
                    style={{
                      transform: `rotate(${randomRotation}deg)`,
                    }}
                  >
                    <img
                      src={social.icon}
                      alt={social.title}
                      className="h-7 w-7"
                    />
                  </div>
                </Link>
              );
            })}
          </div>

          <p className="text-zinc-700 font-medium">
            Follow us on these platforms
          </p>
        </div>
      </div>
    </section>
  );
};

export default Hero;
