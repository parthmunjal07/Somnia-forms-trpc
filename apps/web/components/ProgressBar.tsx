"use client";

import React from "react";

interface ProgressBarProps {
  currentIndex: number;
  total: number;
  mode?: "nodes" | "bar" | "auto";
}

export function ProgressBar({ currentIndex, total, mode = "auto" }: ProgressBarProps) {
  if (total <= 0) return null;

  // Decide mode based on total questions if set to "auto"
  const isNodeMode = mode === "nodes" || (mode === "auto" && total > 3 && total <= 10);
  const percentage = Math.min(Math.max(((currentIndex + 1) / total) * 100, 0), 100);

  if (isNodeMode) {
    return (
      <div className="w-full py-4 flex flex-col items-center justify-center space-y-2 select-none">
        <div className="flex items-center justify-between w-full max-w-md relative px-4">
          {/* Connection Line */}
          <div className="absolute left-6 right-6 top-[15px] h-[1px] bg-current/10 -z-10" />
          <div
            className="absolute left-6 top-[15px] h-[1.5px] bg-current transition-all duration-500 ease-in-out -z-10"
            style={{
              width: `${(currentIndex / (total - 1)) * 90}%`,
            }}
          />

          {Array.from({ length: total }).map((_, idx) => {
            const isActive = idx === currentIndex;
            const isCompleted = idx < currentIndex;

            return (
              <div key={idx} className="flex flex-col items-center relative">
                {/* Node circle */}
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-mono border transition-all duration-500 ${
                    isActive
                      ? "bg-current text-black border-current font-bold shadow-[0_0_15px_rgba(255,255,255,0.4)]"
                      : isCompleted
                      ? "bg-current/10 border-current/80 text-current"
                      : "bg-black/60 border-current/20 text-current/30"
                  }`}
                >
                  {idx + 1}
                </div>
                
                {/* Layer Label */}
                <span
                  className={`text-[8px] font-mono uppercase tracking-widest mt-1.5 transition-all duration-300 ${
                    isActive
                      ? "opacity-100 font-semibold"
                      : isCompleted
                      ? "opacity-60"
                      : "opacity-20"
                  }`}
                >
                  L{idx + 1}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Elegant Single Progress Bar Mode
  return (
    <div className="w-full py-3 select-none flex flex-col space-y-1.5">
      <div className="flex items-center justify-between text-[9px] font-mono uppercase tracking-widest opacity-60">
        <span>Subconscious depth</span>
        <span>
          {currentIndex + 1} / {total} ({Math.round(percentage)}%)
        </span>
      </div>

      <div className="w-full h-[3px] bg-current/10 rounded-full overflow-hidden relative">
        <div
          className="h-full bg-current transition-all duration-500 ease-out shadow-[0_0_8px_currentColor]"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
