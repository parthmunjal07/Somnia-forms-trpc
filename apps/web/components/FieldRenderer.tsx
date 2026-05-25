"use client";

import React, { useEffect, useRef } from "react";

export interface FieldDefinition {
  id: string;
  label: string;
  type: "short_text" | "long_text" | "email" | "number" | "single_select" | "multi_select" | "checkbox" | "date" | "rating" | "layer_break";
  required: boolean;
  placeholder: string | null;
  options: any | null; // string[] for select, number/max info for rating
  validationRules: any | null;
}

interface FieldRendererProps {
  field: FieldDefinition;
  value: any;
  onChange: (val: any) => void;
  error?: string;
}

export function FieldRenderer({
  field,
  value,
  onChange,
  error,
}: FieldRendererProps) {
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  // Focus the input when the field mounted or updated
  useEffect(() => {
    // Small delay to allow transition animations to finish
    const timer = setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [field.id]);

  // Options parsed helper
  const getOptions = (): string[] => {
    if (Array.isArray(field.options)) {
      return field.options as string[];
    }
    return [];
  };

  // Keyboard shortcut options
  const options = getOptions();

  // Rating Max Value
  const getRatingMax = (): number => {
    const opts = field.options;
    if (typeof opts === "number") return opts;
    if (Array.isArray(opts) && opts.length > 0) return Number(opts[0]) || 5;
    if (opts && typeof opts === "object" && !Array.isArray(opts)) {
      return (opts as any).max || 5;
    }
    return 5;
  };

  const maxRating = getRatingMax();

  // Listen to keyboard shortcuts for choices & ratings
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in a text field
      if (["INPUT", "TEXTAREA"].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      const key = e.key.toUpperCase();

      // Options shortcuts (A, B, C...)
      if (field.type === "single_select" || field.type === "multi_select") {
        const optionIdx = key.charCodeAt(0) - 65; // A=0, B=1, etc.
        if (optionIdx >= 0 && optionIdx < options.length) {
          e.preventDefault();
          const targetOpt = options[optionIdx];
          
          if (field.type === "single_select") {
            onChange(targetOpt);
          } else {
            // Multi select toggling
            const currentList = Array.isArray(value) ? [...value] : [];
            const idx = currentList.indexOf(targetOpt);
            if (idx > -1) {
              currentList.splice(idx, 1);
            } else {
              currentList.push(targetOpt);
            }
            onChange(currentList);
          }
        }
      }

      // Rating shortcuts (1, 2, 3...)
      if (field.type === "rating") {
        const ratingVal = parseInt(e.key, 10);
        if (ratingVal >= 1 && ratingVal <= maxRating) {
          e.preventDefault();
          onChange(ratingVal);
        }
      }

      // Checkbox shortcut (Space / Y to toggle)
      if (field.type === "checkbox" && (key === " " || key === "Y")) {
        e.preventDefault();
        onChange(!value);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [field.id, field.type, options, value, maxRating, onChange]);

  return (
    <div className="w-full flex flex-col space-y-3 font-mono animate-in fade-in duration-300">
      {/* Field Label / Prompt */}
      <div className="space-y-1">
        <h3 className="text-lg font-light text-stone-100 leading-snug tracking-wide">
          {field.label} {field.required && <span className="text-red-400 font-bold">*</span>}
        </h3>
        {field.placeholder && (
          <p className="text-[10px] uppercase tracking-wider opacity-40">
            {field.placeholder}
          </p>
        )}
      </div>

      {/* Inputs Renderer */}
      <div className="pt-2">
        {field.type === "short_text" && (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="text"
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Type your answer here..."
            className={`w-full rounded border px-4 py-3 text-sm focus:outline-none transition-all font-mono bg-[var(--theme-surface)] border-[var(--theme-border)] text-[var(--theme-text)] focus:border-[var(--theme-accent)] focus:ring-1 focus:ring-[var(--theme-accent)]`}
          />
        )}

        {field.type === "long_text" && (
          <textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Type your response parameters..."
            rows={4}
            className={`w-full rounded border px-4 py-3 text-sm focus:outline-none transition-all font-mono resize-none h-28 bg-[var(--theme-surface)] border-[var(--theme-border)] text-[var(--theme-text)] focus:border-[var(--theme-accent)] focus:ring-1 focus:ring-[var(--theme-accent)]`}
          />
        )}

        {field.type === "email" && (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="email"
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder="e.g. name@dreamscape.com"
            className={`w-full rounded border px-4 py-3 text-sm focus:outline-none transition-all font-mono bg-[var(--theme-surface)] border-[var(--theme-border)] text-[var(--theme-text)] focus:border-[var(--theme-accent)] focus:ring-1 focus:ring-[var(--theme-accent)]`}
          />
        )}

        {field.type === "number" && (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="number"
            value={value === undefined || value === null ? "" : value}
            onChange={(e) => {
              const val = e.target.value;
              onChange(val === "" ? undefined : Number(val));
            }}
            placeholder="Enter numeric coefficient..."
            className={`w-full rounded border px-4 py-3 text-sm focus:outline-none transition-all font-mono bg-[var(--theme-surface)] border-[var(--theme-border)] text-[var(--theme-text)] focus:border-[var(--theme-accent)] focus:ring-1 focus:ring-[var(--theme-accent)]`}
          />
        )}

        {field.type === "single_select" && (
          <div className="grid grid-cols-1 gap-2 max-h-[220px] overflow-y-auto pr-1">
            {options.map((opt, idx) => {
              const isSelected = value === opt;
              const charLabel = String.fromCharCode(65 + idx); // A, B, C...

              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => {
                    onChange(opt);
                  }}
                  className={`flex items-center justify-between px-4 py-3 rounded border text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer text-left ${
                    isSelected
                      ? "bg-current text-black border-current font-bold"
                      : "bg-black/40 border-current/10 text-current hover:bg-current/5 hover:border-current/30"
                  }`}
                >
                  <span>{opt}</span>
                  <kbd className={`text-[9px] px-1.5 py-0.5 rounded border ml-2 ${
                    isSelected ? "bg-black/20 border-black/20 text-black" : "bg-zinc-900 border-stone-850 text-stone-500"
                  }`}>
                    {charLabel}
                  </kbd>
                </button>
              );
            })}
          </div>
        )}

        {field.type === "multi_select" && (
          <div className="grid grid-cols-1 gap-2 max-h-[220px] overflow-y-auto pr-1">
            {options.map((opt, idx) => {
              const selectedList = Array.isArray(value) ? value : [];
              const isSelected = selectedList.includes(opt);
              const charLabel = String.fromCharCode(65 + idx);

              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => {
                    const currentList = [...selectedList];
                    const optIdx = currentList.indexOf(opt);
                    if (optIdx > -1) {
                      currentList.splice(optIdx, 1);
                    } else {
                      currentList.push(opt);
                    }
                    onChange(currentList);
                  }}
                  className={`flex items-center justify-between px-4 py-3 rounded border text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer text-left ${
                    isSelected
                      ? "bg-current text-black border-current font-bold"
                      : "bg-black/40 border-current/10 text-current hover:bg-current/5 hover:border-current/30"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center ${
                      isSelected ? "border-black bg-black" : "border-current/30 bg-transparent"
                    }`}>
                      {isSelected && <div className="w-1.5 h-1.5 bg-current rounded-sm" />}
                    </div>
                    <span>{opt}</span>
                  </div>
                  <kbd className={`text-[9px] px-1.5 py-0.5 rounded border ml-2 ${
                    isSelected ? "bg-black/20 border-black/20 text-black" : "bg-zinc-900 border-stone-850 text-stone-500"
                  }`}>
                    {charLabel}
                  </kbd>
                </button>
              );
            })}
          </div>
        )}

        {field.type === "checkbox" && (
          <button
            type="button"
            onClick={() => onChange(!value)}
            className={`w-full flex items-center justify-between px-4 py-3.5 rounded border text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer text-left ${
              value
                ? "bg-current text-black border-current font-bold"
                : "bg-black/40 border-current/10 text-current hover:bg-current/5 hover:border-current/30"
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                value ? "border-black bg-black" : "border-current/30 bg-transparent"
              }`}>
                {value && <div className="w-2 h-2 bg-current rounded" />}
              </div>
              <span>I confirm / acknowledge parameters</span>
            </div>
            <kbd className={`text-[9px] px-1.5 py-0.5 rounded border ml-2 ${
              value ? "bg-black/20 border-black/20 text-black" : "bg-zinc-900 border-stone-850 text-stone-500"
            }`}>
              Y
            </kbd>
          </button>
        )}

        {field.type === "date" && (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="date"
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            className={`w-full rounded border px-4 py-3 text-sm focus:outline-none transition-all font-mono bg-[var(--theme-surface)] border-[var(--theme-border)] text-[var(--theme-text)] focus:border-[var(--theme-accent)] focus:ring-1 focus:ring-[var(--theme-accent)]`}
          />
        )}

        {field.type === "rating" && (
          <div className="flex flex-col items-center space-y-2 pt-2">
            <div className="flex items-center justify-center space-x-2 w-full max-w-md">
              {Array.from({ length: maxRating }).map((_, idx) => {
                const ratingNum = idx + 1;
                const isSelected = value === ratingNum;

                return (
                  <button
                    key={ratingNum}
                    type="button"
                    onClick={() => {
                      onChange(ratingNum);
                    }}
                    className={`flex-1 aspect-square max-w-[52px] rounded border flex flex-col items-center justify-center transition-all cursor-pointer ${
                      isSelected
                        ? "bg-current text-black border-current font-bold shadow-[0_0_12px_rgba(255,255,255,0.2)]"
                        : "bg-black/40 border-current/10 text-current hover:bg-current/5 hover:border-current/30"
                    }`}
                  >
                    <span className="text-sm font-bold">{ratingNum}</span>
                    <span className={`text-[8px] mt-0.5 opacity-40 font-normal ${
                      isSelected ? "text-black opacity-60" : ""
                    }`}>
                      [{ratingNum}]
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Field Level Error Banner */}
      {error && (
        <div className="text-[10px] text-red-500 font-semibold uppercase tracking-wider pt-1 flex items-center space-x-1.5 animate-bounce">
          <span>*</span>
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
