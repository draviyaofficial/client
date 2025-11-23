import React from "react";

interface FeatureCardProps {
  img: string;
  title: string;
  desc: string;
  icon: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({
  img,
  title,
  desc,
  icon,
}) => {
  return (
    <div className="relative h-[600px] w-full border border-zinc-800 rounded-4xl overflow-hidden">
      {/* Background image */}
      <img src={img} alt={title} className="w-full h-full object-cover" />

      {/* Overlay */}
      <div className="absolute inset-0 bg-linear-to-t from-black via-black/40 to-transparent" />

      {/* Text */}
      <div className="absolute bottom-6 left-6 text-white p-10 flex flex-col gap-5">
        <img src={icon} alt={title} className="h-10 w-10" />
        <h2 className="text-3xl font-semibold">{title}</h2>
        <p className="text-base text-zinc-400">{desc}</p>
      </div>
    </div>
  );
};

export default FeatureCard;
