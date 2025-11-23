import React from "react";

interface MiniCardProps {
  images: string[];
  rotation?: string;
  title: string;
}

const MiniCard: React.FC<MiniCardProps> = ({
  images,
  rotation = "",
  title,
}) => {
  return (
    <div
      className={`p-10 flex flex-col gap-16 h-fit w-1/3 bg-zinc-900/80 rounded-4xl border border-zinc-800 shadow-2xl shadow-black ${rotation}`}
    >
      <div className="flex">
        {images.map((img, idx) => {
          const randomRotation = Math.random() * 20 - 10;
          return (
            <img
              key={idx}
              src={img}
              style={{
                transform: `rotate(${randomRotation}deg)`,
              }}
              alt=""
              className="h-20 w-20 rounded-xl border border-zinc-400 shadow-lg shadow-black rotate-2"
            />
          );
        })}
      </div>

      <p className="text-2xl font-medium text-white">{title}</p>
    </div>
  );
};

export default MiniCard;
