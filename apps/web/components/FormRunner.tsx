"use client";

import React, { useState, useEffect, useRef } from "react";
import { trpc } from "~/trpc/client";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, CornerDownLeft, RefreshCw, LogOut } from "lucide-react";
import { Totem } from "./Totem";
import { ProgressBar } from "./ProgressBar";
import { FieldRenderer, FieldDefinition } from "./FieldRenderer";

interface FormRunnerProps {
  form: {
    id: string;
    title: string;
    theme: string;
    thankYouMessage: string | null;
    redirectUrl: string | null;
  };
  fields: FieldDefinition[];
  passcode?: string;
  styles: {
    bg: string;
    cardBg: string;
    input: string;
    btn: string;
    accent: string;
    glow: string;
  };
}

export function FormRunner({ form, fields, passcode, styles }: FormRunnerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Submission & Animation states
  const [submitStatus, setSubmitStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [totemStatus, setTotemStatus] = useState<"spinning" | "decelerating" | "stopped">("spinning");
  const [showFlash, setShowFlash] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState<number | null>(null);

  const submitMutation = trpc.responses.submit.useMutation();

  const currentField = fields[currentIndex];

  // Helper validation matching backend
  const validateField = (field: FieldDefinition, val: any): string | null => {
    const rules = field.validationRules as Record<string, any> | null;
    const isRequired = field.required;

    // Check required
    if (isRequired) {
      if (val === undefined || val === null) {
        return "This parameter is required to stabilize the layer.";
      }
      if (typeof val === "string" && val.trim() === "") {
        return "This parameter is required to stabilize the layer.";
      }
      if (Array.isArray(val) && val.length === 0) {
        return "At least one selection is required.";
      }
      if (field.type === "checkbox" && val !== true) {
        return "You must confirm this parameter.";
      }
    }

    // If there's no value and not required, it's valid
    if (val === undefined || val === null || (typeof val === "string" && val.trim() === "")) {
      return null;
    }

    // Validate email pattern
    if (field.type === "email") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(String(val))) {
        return "Invalid email coordinates.";
      }
    }

    // Custom rules (minLength, maxLength, min, max, pattern)
    if (rules) {
      if (field.type === "short_text" || field.type === "long_text" || field.type === "email") {
        const strVal = String(val);
        if (typeof rules.minLength === "number" && strVal.length < rules.minLength) {
          return `Parameter requires minimum of ${rules.minLength} characters.`;
        }
        if (typeof rules.maxLength === "number" && strVal.length > rules.maxLength) {
          return `Parameter maximum boundary is ${rules.maxLength} characters.`;
        }
        if (typeof rules.pattern === "string" && rules.pattern !== "") {
          try {
            const regex = new RegExp(rules.pattern);
            if (!regex.test(strVal)) {
              return "Coordinates format invalid.";
            }
          } catch (e) {
            // invalid regex
          }
        }
      }

      if (field.type === "number") {
        const numVal = Number(val);
        if (isNaN(numVal)) {
          return "Value must be a valid numeric coefficient.";
        }
        if (typeof rules.min === "number" && numVal < rules.min) {
          return `Coefficient must be at least ${rules.min}.`;
        }
        if (typeof rules.max === "number" && numVal > rules.max) {
          return `Coefficient must be at most ${rules.max}.`;
        }
      }
    }

    return null;
  };

  const handleValueChange = (val: any) => {
    if (!currentField) return;
    setAnswers((prev) => ({ ...prev, [currentField.id]: val }));
    
    // Clear validation error dynamically if it becomes valid
    if (errors[currentField.id]) {
      const err = validateField(currentField, val);
      setErrors((prev) => {
        const updated = { ...prev };
        if (!err) {
          delete updated[currentField.id];
        } else {
          updated[currentField.id] = err;
        }
        return updated;
      });
    }
  };

  const handleNext = () => {
    if (!currentField) return;

    // Run validation on active field
    const activeVal = answers[currentField.id];
    const validationError = validateField(currentField, activeVal);

    if (validationError) {
      setErrors((prev) => ({ ...prev, [currentField.id]: validationError }));
      toast.error(validationError);
      return;
    }

    // Clear error
    setErrors((prev) => {
      const updated = { ...prev };
      delete updated[currentField.id];
      return updated;
    });

    if (currentIndex < fields.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      // Last question - initiate submission
      handleSubmitForm();
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  // Keyboard navigation listener
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // If user presses Shift+Enter, go back
      if (e.key === "Enter" && e.shiftKey) {
        e.preventDefault();
        handleBack();
        return;
      }

      // If user presses Enter without Shift
      if (e.key === "Enter" && !e.shiftKey) {
        // Skip advancing if focusing on a textarea
        if (document.activeElement?.tagName === "TEXTAREA") {
          return;
        }
        e.preventDefault();
        handleNext();
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [currentIndex, answers, currentField]);

  const startedAt = useRef<number>(0);
  useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  // Submission endpoint triggers
  const handleSubmitForm = async () => {
    setSubmitStatus("submitting");
    setTotemStatus("spinning");

    const elapsedSeconds = Math.max(1, Math.round((Date.now() - startedAt.current) / 1000));

    try {
      await submitMutation.mutateAsync({
        formId: form.id,
        data: answers,
        password: passcode,
        timeToComplete: elapsedSeconds,
      });

      // Submit success: trigger "kick/flash" effect & totem deceleration
      setSubmitStatus("success");
      setTotemStatus("decelerating");
      setShowFlash(true);
      toast.success("Projection parameters synchronized successfully.");

      // Totem stop spin timeout
      setTimeout(() => {
        setTotemStatus("stopped");
      }, 1500);

      // Flash fade out timeout
      setTimeout(() => {
        setShowFlash(false);
      }, 800);

      // Handle redirect countdown if redirectUrl is specified
      if (form.redirectUrl) {
        setRedirectCountdown(3);
      }
    } catch (err: any) {
      setSubmitStatus("error");
      toast.error(err.message || "Failed to commit projection variables.");
    }
  };

  // Redirect Countdown timer
  useEffect(() => {
    if (redirectCountdown === null) return;

    if (redirectCountdown === 0) {
      if (form.redirectUrl) {
        window.location.href = form.redirectUrl;
      }
      return;
    }

    const timer = setTimeout(() => {
      setRedirectCountdown((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => clearTimeout(timer);
  }, [redirectCountdown, form.redirectUrl]);

  // Handle immediate skip redirect
  const handleImmediateRedirect = () => {
    if (form.redirectUrl) {
      window.location.href = form.redirectUrl;
    }
  };

  // Render Thank You Page
  if (submitStatus === "success" && totemStatus === "stopped" && !showFlash) {
    return (
      <div className={`min-h-screen ${styles.bg} flex flex-col items-center justify-center p-6 md:p-8 font-mono relative`}>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,currentColor_1px,transparent_1px),linear-gradient(to_bottom,currentColor_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-3 pointer-events-none" />

        <div className={`w-full max-w-lg border p-8 rounded-lg text-center ${styles.cardBg} ${styles.glow} space-y-8 animate-in fade-in duration-500`}>
          {/* Static resting Totem */}
          <div className="flex justify-center">
            <Totem status="stopped" />
          </div>

          <div className="space-y-3">
            <h2 className="text-3xl font-light font-cormorant tracking-wide">
              Projection Stabilized
            </h2>
            <p className="text-[9px] uppercase tracking-[0.25em] opacity-50 font-bold">
              Cognitive layer inputs recorded
            </p>
          </div>

          <div className="border-t border-b border-dashed border-current/15 py-6 px-4 text-xs leading-relaxed opacity-75 whitespace-pre-wrap">
            {form.thankYouMessage || "THE PROJECTED DATA STABILIZED SUCCESSFULLY. YOU HAVE COMPLETED THIS SUB-LEVEL. YOU MAY SAFELY WAKE UP."}
          </div>

          {/* Redirect Countdown UI */}
          {redirectCountdown !== null && (
            <div className="space-y-4 pt-2">
              <p className="text-[10px] tracking-widest uppercase text-current/60 animate-pulse font-semibold">
                RECONSTRUCTING COGNITIVE LAYER... REDIRECTING IN {redirectCountdown}...
              </p>
              
              <button
                onClick={handleImmediateRedirect}
                className={`px-6 py-2.5 rounded text-[10px] font-bold uppercase tracking-widest border transition-all cursor-pointer inline-flex items-center space-x-2 ${styles.btn}`}
              >
                <span>Wake Up Now</span>
                <LogOut size={12} />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Render Form Runner (active questions)
  return (
    <div className={`min-h-screen ${styles.bg} flex flex-col items-center justify-center p-6 md:p-8 font-mono relative overflow-hidden`}>
      {/* Background grids */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,currentColor_1px,transparent_1px),linear-gradient(to_bottom,currentColor_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-3 pointer-events-none" />

      {/* "The Kick" White Flash Overlay */}
      <div
        className={`fixed inset-0 bg-white z-50 pointer-events-none transition-opacity duration-300 ${
          showFlash ? "opacity-100" : "opacity-0"
        }`}
      />

      <div className={`w-full max-w-2xl border p-8 rounded-lg flex flex-col justify-between min-h-[460px] relative ${styles.cardBg} ${styles.glow} transition-all duration-300`}>
        
        {/* Top bar: Form Title & Totem */}
        <div className="flex items-center justify-between border-b border-current/10 pb-4">
          <div className="truncate">
            <h1 className="text-xl font-light font-cormorant tracking-wide truncate">
              {form.title}
            </h1>
            <p className="text-[8px] uppercase tracking-widest opacity-50 mt-0.5">
              DEPTH LEVEL: {currentIndex + 1}
            </p>
          </div>

          <div className="w-12 h-12 flex items-center justify-center">
            <Totem status={totemStatus} className="scale-[0.5]" />
          </div>
        </div>

        {/* Middle Area: Question Renderer with slide-down/fade animate key */}
        <div key={currentIndex} className="flex-1 py-8 flex flex-col justify-center animate-in fade-in slide-in-from-bottom-8 duration-300">
          {currentField ? (
            <FieldRenderer
              field={currentField}
              value={answers[currentField.id]}
              onChange={handleValueChange}
              styles={styles}
              error={errors[currentField.id]}
              onAutoAdvance={handleNext}
            />
          ) : (
            <div className="text-center text-xs opacity-50 uppercase tracking-widest">
              Limbo detected: No fields projected.
            </div>
          )}
        </div>

        {/* Bottom Area: Progress & Controls */}
        <div className="border-t border-current/10 pt-4 flex flex-col space-y-4">
          <ProgressBar currentIndex={currentIndex} total={fields.length} />

          <div className="flex items-center justify-between">
            {/* Back button */}
            <button
              type="button"
              onClick={handleBack}
              disabled={currentIndex === 0 || submitStatus === "submitting"}
              className={`p-2.5 rounded border border-current/15 text-current/60 hover:text-current hover:border-current/40 transition-all cursor-pointer text-xs disabled:opacity-20 disabled:cursor-not-allowed inline-flex items-center space-x-1.5 font-bold uppercase tracking-wider`}
            >
              <ArrowLeft size={14} />
              <span className="hidden sm:inline">Back</span>
            </button>

            {/* Keyboard hint */}
            <div className="hidden md:flex items-center space-x-1 opacity-30 text-[9px] uppercase tracking-wider font-semibold">
              <span>Press Enter</span>
              <kbd className="px-1 border rounded bg-current/5 border-current/20">
                <CornerDownLeft size={8} className="inline" />
              </kbd>
              <span>or Click OK</span>
            </div>

            {/* Next / OK Button */}
            <button
              type="button"
              onClick={handleNext}
              disabled={submitStatus === "submitting"}
              className={`px-5 py-2.5 rounded text-xs font-bold uppercase tracking-widest border transition-all cursor-pointer inline-flex items-center space-x-2 ${styles.btn}`}
            >
              {submitStatus === "submitting" ? (
                <>
                  <span>Syncing...</span>
                  <RefreshCw size={13} className="animate-spin" />
                </>
              ) : (
                <>
                  <span>{currentIndex === fields.length - 1 ? "Stabilize" : "OK"}</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
