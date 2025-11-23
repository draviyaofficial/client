import React from "react";
import FeatureMiniCard from "./MiniCard";

const MiniCardSection: React.FC = () => {
  return (
    <div className="h-fit w-full flex justify-center items-center relative -top-30 mb-20">
      <FeatureMiniCard
        images={[
          "/images/features/feature11.jpg",
          "/images/features/feature12.jpg",
        ]}
        rotation="rotate-2"
        title="Launch your own creator token like it’s your personal IPO moment"
      />

      <FeatureMiniCard
        images={[
          "/images/features/feature21.webp",
          "/images/features/feature22.webp",
          "/images/features/feature23.png",
        ]}
        rotation="-rotate-3"
        title="Buy and trade creator shares without the Wall Street drama"
      />

      <FeatureMiniCard
        images={["/images/logo/logo-icon.jpeg"]}
        rotation="rotate-4"
        title="Build a flex-worthy portfolio powered by your favorite creators"
      />
    </div>
  );
};

export default MiniCardSection;
