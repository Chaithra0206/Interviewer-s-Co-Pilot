// app/providers.tsx
"use client";

import { useEffect } from "react";
import { gsap } from "gsap";

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Register GSAP plugins if needed
    gsap.config({
      nullTargetWarn: false,
    });
  }, []);

  return <>{children}</>;
}