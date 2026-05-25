"use client";

import { useEffect, useState } from "react";

function Totem({
  size = 24,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1" />
      <circle cx="12" cy="12" fill="currentColor" r="3" />
      <path
        d="M12 2V5M12 19V22M2 12H5M19 12H22"
        stroke="currentColor"
        strokeWidth="1"
      />
    </svg>
  );
}

interface IntroAnimationProps {
  onComplete: () => void;
  skip?: boolean;
}

export default function IntroAnimation({ onComplete, skip }: IntroAnimationProps) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const handleComplete = () => {
      try {
        localStorage.setItem("somnia_intro_seen", "true");
      } catch (e) {
        // Ignore localStorage errors
      }
      onComplete();
    };

    if (skip) {
      handleComplete();
      return;
    }

    const t1 = setTimeout(() => setStep(1), 300);   // totem appears
    const t2 = setTimeout(() => setStep(2), 1200);  // ripple
    const t3 = setTimeout(() => setStep(3), 2000);  // text
    const t4 = setTimeout(() => setStep(4), 2600);  // tagline
    const t5 = setTimeout(() => setStep(5), 3200);  // progress bar
    const t6 = setTimeout(() => setStep(6), 4200);  // exit sequence
    const t7 = setTimeout(() => setStep(7), 4500);  // totem flies
    const t8 = setTimeout(() => setStep(8), 5000);  // overlay fades
    const t9 = setTimeout(() => handleComplete(), 5500); // unmount

    return () => [t1, t2, t3, t4, t5, t6, t7, t8, t9].forEach(clearTimeout);
  }, [skip, onComplete]);

  const handleSkip = () => {
    try {
      localStorage.setItem("somnia_intro_seen", "true");
    } catch (e) {}
    onComplete();
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        backgroundColor: "#000000",
        opacity: step >= 8 ? 0 : 1,
        transition: "opacity 500ms ease-in",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: step >= 8 ? "none" : "auto",
      }}
    >
      {/* Totem */}
      <div
        style={{
          position: "fixed",
          top: step >= 7 ? "14px" : "50%",
          left: step >= 7 ? "28px" : "50%",
          transform: step >= 7 ? "translate(0, 0) scale(0.458)" : "translate(-50%, -50%) scale(1)",
          transition: step >= 7
            ? "top 600ms cubic-bezier(0.4, 0, 0.2, 1), left 600ms cubic-bezier(0.4, 0, 0.2, 1), transform 600ms cubic-bezier(0.4, 0, 0.2, 1)"
            : "none",
          width: "48px",
          height: "48px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            opacity: step >= 1 ? 1 : 0,
            transform: step >= 1 ? "scale(1)" : "scale(0.85)",
            transition: step >= 1 ? "opacity 600ms ease-out, transform 600ms ease-out" : "none",
            width: "100%",
            height: "100%",
          }}
        >
          <Totem
            size={48}
            className="text-[#C9933A] animate-[spin_10s_linear_infinite]"
          />
        </div>
      </div>

      {/* Ripple */}
      <div style={{
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        borderRadius: "50%",
        border: "0.5px solid #C9933A",
        pointerEvents: "none",
        width: step >= 2 ? "280px" : "48px",
        height: step >= 2 ? "280px" : "48px",
        opacity: step >= 2 ? 0 : step >= 1 ? 0.6 : 0,
        transition: step >= 2
          ? "width 1400ms ease-out, height 1400ms ease-out, opacity 1400ms ease-out"
          : "none",
      }} />

      {/* SOMNIA Text & Tagline Container */}
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, 64px)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <div
          className="font-cormorant font-light"
          style={{
            color: "#EEF3F8",
            letterSpacing: "0.3em",
            fontSize: "clamp(48px, 6vw, 72px)",
            display: "flex",
            opacity: step >= 6 ? 0 : 1,
            transition: step >= 6 ? "opacity 400ms" : "none",
          }}
        >
          {["S","O","M","N","I","A"].map((char, i) => (
            <span
              key={i + char}
              style={{
                display: "inline-block",
                opacity: step >= 3 ? 1 : 0,
                transform: step >= 3 ? "translateY(0)" : "translateY(8px)",
                transition: step < 6 ? `opacity 400ms ease-out ${i * 80}ms, transform 400ms ease-out ${i * 80}ms` : "none",
              }}
            >
              {char}
            </span>
          ))}
        </div>

        <div
          style={{
            marginTop: "16px",
            fontFamily: "JetBrains Mono, monospace",
            fontSize: "11px",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "#8BA3BF",
            opacity: step >= 6 ? 0 : step >= 4 ? 1 : 0,
            transform: step >= 4 ? "translateY(0)" : "translateY(6px)",
            transition: step >= 6 
              ? "opacity 300ms"
              : "opacity 500ms ease-out, transform 500ms ease-out",
          }}
        >
          Forms that feel like cinema.
        </div>
      </div>

      {/* Progress Bar */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          height: "1px",
          width: "100%",
          background: "rgba(200,216,232,0.08)",
          opacity: step >= 6 ? 0 : step >= 5 ? 1 : 0,
          transition: step >= 6 ? "opacity 300ms" : "none",
        }}
      >
        <div
          style={{
            height: "100%",
            background: "#C9933A",
            width: step >= 5 ? "100%" : "0%",
            transition: step >= 5 ? "width 800ms ease-in-out" : "none",
          }}
        />
      </div>

      {/* Skip Button */}
      <button
        onClick={handleSkip}
        style={{
          position: "fixed",
          bottom: "24px",
          right: "24px",
          opacity: step >= 1 && step < 8 ? 0.4 : 0,
          transition: "opacity 400ms",
          background: "transparent",
          border: "0.5px solid rgba(200,216,232,0.2)",
          color: "#8BA3BF",
          fontFamily: "JetBrains Mono, monospace",
          fontSize: "9px",
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          padding: "8px 16px",
          cursor: "pointer",
          borderRadius: "2px",
          pointerEvents: step >= 1 && step < 8 ? "auto" : "none",
        }}
      >
        Skip →
      </button>
    </div>
  );
}
