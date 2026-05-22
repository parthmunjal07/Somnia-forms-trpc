"use client";

import React from "react";

interface TotemProps {
  status: "spinning" | "decelerating" | "stopped";
  className?: string;
}

export function Totem({ status, className = "" }: TotemProps) {
  // Determine animation classes based on status
  let spinClass = "animate-[spin_1s_linear_infinite]";
  let wobbleClass = "";

  if (status === "decelerating") {
    // Decelerating: spin slower, add wobble
    spinClass = "animate-[spin_3s_linear_infinite] transition-all duration-[3000ms] ease-out";
    wobbleClass = "animate-[bounce_1.5s_ease-in-out_infinite]";
  } else if (status === "stopped") {
    // Stopped: resting angle, no spin
    spinClass = "rotate-[15deg] transition-all duration-1000 ease-out";
    wobbleClass = "";
  }

  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}>
      {/* Outer dreamscape grid track */}
      <div
        className={`absolute w-32 h-32 border border-dashed border-current/10 rounded-full transition-all duration-1000 ${
          status === "spinning"
            ? "animate-[spin_8s_linear_infinite]"
            : status === "decelerating"
            ? "animate-[spin_16s_linear_infinite] opacity-60"
            : "opacity-20"
        }`}
      />
      <div
        className={`absolute w-24 h-24 border border-current/5 rounded-full transition-all duration-1000 ${
          status === "spinning"
            ? "animate-[spin_12s_linear_infinite_reverse]"
            : "opacity-10"
        }`}
      />

      {/* Main Totem SVG wrapper */}
      <div className={`${wobbleClass} transition-all duration-1000`}>
        <svg
          width="80"
          height="80"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`${spinClass} transition-all origin-center`}
        >
          {/* Stem */}
          <path
            d="M50 15V35"
            stroke="currentColor"
            strokeWidth="3.5"
            strokeLinecap="round"
            className="opacity-90"
          />
          
          {/* Bulbous Upper Body (geometric panel cuts) */}
          <path
            d="M50 35 L75 48 L50 62 L25 48 Z"
            fill="currentColor"
            fillOpacity="0.05"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          
          {/* Geometric inner structure */}
          <path
            d="M50 35 V62"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeDasharray="2 2"
            className="opacity-60"
          />
          <path
            d="M25 48 H75"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeDasharray="2 2"
            className="opacity-60"
          />
          
          {/* Inner ring overlay */}
          <circle
            cx="50"
            cy="48"
            r="12"
            stroke="currentColor"
            strokeWidth="1"
            className="opacity-40 animate-pulse"
          />

          {/* Bulbous Lower Body / Spinner tip */}
          <path
            d="M50 62 L60 78 L50 85 L40 78 Z"
            fill="currentColor"
            fillOpacity="0.1"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          
          {/* Tip contact point */}
          <circle cx="50" cy="85" r="1.5" fill="currentColor" className="animate-ping" />
        </svg>
      </div>

      {/* Shadow layer underneath */}
      <div
        className={`absolute bottom-[-10px] w-12 h-2.5 bg-black/40 blur-[4px] rounded-full transition-all duration-1000 ${
          status === "spinning"
            ? "scale-95 opacity-80"
            : status === "decelerating"
            ? "scale-105 opacity-60 animate-[pulse_1.5s_ease-in-out_infinite]"
            : "scale-110 opacity-30 translate-x-[4px]"
        }`}
      />
    </div>
  );
}
