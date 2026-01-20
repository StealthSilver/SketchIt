"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";

// Dynamically import the canvas component to reduce initial bundle size
const InfiniteCanvas = dynamic(
  () =>
    import("@/components/InfiniteCanvas").then((mod) => ({
      default: mod.InfiniteCanvas,
    })),
  {
    ssr: false, // Canvas should only run on client
    loading: () => (
      <div className="flex items-center justify-center h-screen bg-black">
        <div className="text-white text-xl">Loading canvas...</div>
      </div>
    ),
  },
);

export default function DrawPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-screen bg-black">
          <div className="text-white">Loading...</div>
        </div>
      }
    >
      <InfiniteCanvas />
    </Suspense>
  );
}
