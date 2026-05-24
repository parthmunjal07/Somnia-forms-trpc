"use client";

import React from "react";
import { Check } from "lucide-react";

export const THEMES = [
  { id: "inception", name: "Inception" },
  { id: "dark_knight", name: "Dark Knight" },
  { id: "interstellar", name: "Interstellar" },
  { id: "tenet", name: "Tenet" },
];

interface ThemePickerProps {
  currentTheme: string;
  onChange: (theme: string) => void;
}

export function ThemePicker({ currentTheme, onChange }: ThemePickerProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {THEMES.map((theme) => {
          const isActive = currentTheme === theme.id;
          return (
            <button
              key={theme.id}
              onClick={() => onChange(theme.id)}
              className={`relative flex flex-col items-center gap-2 rounded-lg border-2 p-3 transition-all ${
                isActive ? "border-emerald-500 bg-emerald-500/5" : "border-stone-800 hover:border-stone-700 hover:bg-stone-900/50"
              }`}
            >
              {/* Miniature Preview Container */}
              <div 
                className={`w-[60px] h-[80px] rounded border border-white/10 relative overflow-hidden skin-${theme.id}`}
                style={{ backgroundColor: "var(--theme-bg)" }}
              >
                {/* Fake UI elements representing the form layout */}
                <div className="absolute inset-x-2 top-2 h-1.5 rounded-sm" style={{ backgroundColor: "var(--theme-surface)", border: "1px solid var(--theme-border)" }} />
                <div className="absolute inset-x-2 top-5 h-8 rounded-sm p-1" style={{ backgroundColor: "var(--theme-surface)", border: "1px solid var(--theme-border)" }}>
                  <div className="h-0.5 w-1/2 mb-1" style={{ backgroundColor: "var(--theme-text)", opacity: 0.5 }} />
                  <div className="h-2 w-full rounded-[1px]" style={{ backgroundColor: "var(--theme-bg)", border: "1px solid var(--theme-border)" }} />
                  <div className="h-1.5 w-full mt-1 rounded-[1px]" style={{ backgroundColor: "var(--theme-accent)" }} />
                </div>
              </div>
              
              <div className="text-xs font-mono">{theme.name}</div>
              
              {isActive && (
                <div className="absolute top-2 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-black">
                  <Check size={10} strokeWidth={3} />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
