import React from "react";

const Tagline: React.FC = () => {
  return (
    <div className="h-[500px] w-full relative flex items-center justify-center">
      <img
        src="/images/features/bg.png"
        alt=""
        className="h-full w-full object-contain"
      />

      <h3 className="text-7xl text-white max-w-4xl absolute top-0 mt-20 text-center">
        Discover, invest, and thrive{" "}
        <span className="text-zinc-400">in the new creator economy.</span>
      </h3>
    </div>
  );
};

export default Tagline;
