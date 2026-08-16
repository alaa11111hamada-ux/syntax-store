"use client";

import dynamic from "next/dynamic";

const Lottie = dynamic(() => import("lottie-react"), { ssr: false });

import animData from "../data/search-animation.json";

export default function TrackIcon() {
  return (
    <div className="mx-auto h-20 w-20">
      <Lottie
        animationData={animData}
        loop={false}
        autoplay
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
}
