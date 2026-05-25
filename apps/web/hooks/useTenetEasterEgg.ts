"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

export function useTenetEasterEgg() {
  const [keys, setKeys] = useState<string>("");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore keypresses inside inputs or textareas so we don't accidentally trigger while typing normally
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement).isContentEditable
      ) {
        return;
      }

      setKeys((prev) => {
        // Only consider single character keys to build the string
        if (e.key.length !== 1) return prev;
        
        const next = (prev + e.key).slice(-5).toUpperCase();
        if (next === "TENET") {
          if (document.body.style.transform === "scaleX(-1)") {
            document.body.style.transform = "";
          } else {
            document.body.style.transform = "scaleX(-1)";
          }
          toast("We live in a twilight world.");
          return ""; // Reset after triggering
        }
        return next;
      });
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);
}
