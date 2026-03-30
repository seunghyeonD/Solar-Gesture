"use client";

import dynamic from "next/dynamic";

const SolarSystem = dynamic(() => import("@/components/SolarSystem"), {
  ssr: false,
});

export default function Home() {
  return <SolarSystem />;
}
