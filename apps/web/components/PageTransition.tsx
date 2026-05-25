"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { usePathname } from "next/navigation";
import { toast } from "sonner";

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const shouldReduceMotion = useReducedMotion();
  const [isInverted, setIsInverted] = useState(false);

  useEffect(() => {
    const konami = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];
    let index = 0;
    
    const handler = (e: KeyboardEvent) => {
      if (e.key === konami[index]) {
        index++;
        if (index === konami.length) {
          setIsInverted(true);
          import("~/lib/achievements").then(m => m.unlockAchievement("konami_code"));
          toast("Temporal anomaly detected.", {
            style: { background: "#F43F5E", color: "#FFF", border: "none", fontWeight: "bold" },
            duration: 3000
          });
          setTimeout(() => setIsInverted(false), 3000);
          index = 0;
        }
      } else {
        index = 0;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const variants = shouldReduceMotion
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1, transition: { duration: 0.1 } },
        exit: { opacity: 0, transition: { duration: 0.1 } },
      }
    : {
        initial: { opacity: 0, y: 12, scale: 0.98 },
        animate: {
          opacity: 1,
          y: 0,
          scale: 1,
          transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] as const },
        },
        exit: {
          opacity: 0,
          y: -8,
          scale: 0.99,
          transition: { duration: 0.25, ease: "easeIn" as any },
        },
      };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={variants}
        style={{ 
          filter: isInverted ? "invert(1) hue-rotate(180deg) sepia(0.5)" : "none", 
          transition: "filter 0.5s ease"
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
