import React from "react";
import NextImage from "next/image";

const Tagline: React.FC = () => {
  return (
    <div className="h-[300px] sm:h-[350px] lg:h-[400px] xl:h-[500px] w-full relative flex items-center justify-center">
      <NextImage
        src="/images/features/bg.png"
        alt="Features Background"
        fill
        className="object-contain"
      />

      <h3 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl 2xl:text-7xl text-white max-w-2xl sm:max-w-3xl lg:max-w-4xl absolute top-0 mt-8 sm:mt-12 lg:mt-16 xl:mt-20 text-center leading-tight px-4 sm:px-6">
        Discover, invest, and thrive{" "}
        <span className="text-zinc-400">in the new creator economy.</span>
      </h3>
    </div>
  );
};

export default Tagline;
