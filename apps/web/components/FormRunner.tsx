"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { trpc } from "~/trpc/client";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, CornerDownLeft, RefreshCw, LogOut } from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
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
  isPreview?: boolean;
  onSimulateSubmit?: (data: Record<string, any>) => void;
}

export function FormRunner({ form, fields, passcode, isPreview, onSimulateSubmit} : FormRunnerProps) {
  const [currentLayerIndex, setCurrentLayerIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const shouldReduceMotion = useReducedMotion();
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const layers = useMemo(() => {
    const result: { title: string | null; fields: FieldDefinition[] }[] = [];
    let currentChunk: FieldDefinition[] = [];
    let currentTitle: string | null = null;
    
    fields.forEach((field) => {
      if (field.type === "layer_break") {
        result.push({ title: currentTitle, fields: currentChunk });
        currentChunk = [];
        currentTitle = field.label;
      } else {
        currentChunk.push(field);
      }
    });
    
    // Push the last chunk
    result.push({ title: currentTitle, fields: currentChunk });
    return result;
  }, [fields]);

  const variants = {
    initial: (d: number) => ({
      y: d > 0 ? -20 : 20,
      opacity: 0,
      scale: 0.97
    }),
    animate: {
      y: 0,
      opacity: 1,
      scale: 1
    },
    exit: (d: number) => ({
      y: d > 0 ? 20 : -20,
      opacity: 0,
      scale: 0.97
    })
  };

  const reducedVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 }
  };

  
  // Submission & Animation states
  const [submitStatus, setSubmitStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [totemStatus, setTotemStatus] = useState<"spinning" | "decelerating" | "stopped">("spinning");
  const [showFlash, setShowFlash] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState<number | null>(null);

  const submitMutation = trpc.responses.submit.useMutation();

  const currentLayer = layers[currentLayerIndex];

  // Helper validation matching backend
  const validateField = (field: FieldDefinition, val: any): string | null => {
    if (field.type === "layer_break") return null;
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

  const handleValueChange = (field: FieldDefinition, val: any) => {
    setAnswers((prev) => ({ ...prev, [field.id]: val }));
    
    // Clear validation error dynamically if it becomes valid
    if (errors[field.id]) {
      const err = validateField(field, val);
      setErrors((prev) => {
        const updated = { ...prev };
        if (!err) {
          delete updated[field.id];
        } else {
          updated[field.id] = err;
        }
        return updated;
      });
    }
  };

  const handleNext = () => {
    if (!currentLayer) return;

    let layerIsValid = true;
    const newErrors = { ...errors };

    currentLayer.fields.forEach(field => {
      const err = validateField(field, answers[field.id]);
      if (err) {
        layerIsValid = false;
        newErrors[field.id] = err;
      } else {
        delete newErrors[field.id];
      }
    });

    setErrors(newErrors);

    if (!layerIsValid) {
      toast.error("Please stabilize all parameters in this layer before proceeding.");
      return;
    }

    const isInverted = form.theme === 'tenet' && process.env.NEXT_PUBLIC_REFRESH_SECRET;
    if (currentLayerIndex < layers.length - 1) {
      setDirection(isInverted ? -1 : 1);
      setCurrentLayerIndex((prev) => prev + 1);
    } else {
      // Last layer - initiate submission
      handleSubmitForm();
    }
  };

  const handleBack = () => {
    const isInverted = form.theme === 'tenet' && process.env.NEXT_PUBLIC_REFRESH_SECRET;
    if (currentLayerIndex > 0) {
      setDirection(isInverted ? 1 : -1);
      setCurrentLayerIndex((prev) => prev - 1);
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
  }, [currentLayerIndex, answers, currentLayer]);

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
      if (isPreview && onSimulateSubmit) {
        onSimulateSubmit(answers);
        await new Promise((resolve) => setTimeout(resolve, 800));
      } else {
        await submitMutation.mutateAsync({
          formId: form.id,
          data: answers,
          password: passcode,
          timeToComplete: elapsedSeconds,
        });
      }

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
    <div className={`skin-${form.theme} min-h-screen bg-[var(--theme-bg)] text-[var(--theme-text)] flex flex-col items-center justify-center p-6 md:p-8 font-mono relative`}>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,currentColor_1px,transparent_1px),linear-gradient(to_bottom,currentColor_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-3 pointer-events-none" />

        <motion.div
          initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
          animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
          className={`w-full max-w-lg border p-8 rounded-lg text-center bg-[var(--theme-surface)] border-[var(--theme-border)] shadow-[0_0_15px_var(--theme-border)]  space-y-8`}
        >
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
            {form.theme === 'tenet' && process.env.NEXT_PUBLIC_REFRESH_SECRET ? (
              <div className="flex flex-wrap justify-center gap-1 rtl flex-row-reverse">
                {(form.thankYouMessage || "THE PROJECTED DATA STABILIZED SUCCESSFULLY. YOU HAVE COMPLETED THIS SUB-LEVEL. YOU MAY SAFELY WAKE UP.")
                  .split(' ')
                  .map((word, i) => (
                    <motion.span
                      key={i}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1, duration: 0.3 }}
                      className="inline-block"
                    >
                      {word}
                    </motion.span>
                  ))}
              </div>
            ) : (
              form.thankYouMessage || "THE PROJECTED DATA STABILIZED SUCCESSFULLY. YOU HAVE COMPLETED THIS SUB-LEVEL. YOU MAY SAFELY WAKE UP."
            )}
          </div>

          {/* Redirect Countdown UI */}
          {redirectCountdown !== null && (
            <div className="space-y-4 pt-2">
              <p className="text-[10px] tracking-widest uppercase text-current/60 animate-pulse font-semibold">
                RECONSTRUCTING COGNITIVE LAYER... REDIRECTING IN {redirectCountdown}...
              </p>
              
              <button
                onClick={handleImmediateRedirect}
                className={`px-6 py-2.5 rounded text-[10px] font-bold uppercase tracking-widest border transition-all cursor-pointer inline-flex items-center space-x-2 bg-[var(--theme-accent)] text-[var(--theme-bg)] border-[var(--theme-accent)] hover:opacity-90`}
              >
                <span>Wake Up Now</span>
                <LogOut size={12} />
              </button>
            </div>
          )}
        </motion.div>
      </div>
    );
  }

  // Render Form Runner (active questions)
  return (
    <div className={`skin-${form.theme} min-h-screen bg-[var(--theme-bg)] text-[var(--theme-text)] flex flex-col items-center justify-center p-6 md:p-8 font-mono relative overflow-hidden`}>
      {/* Background grids */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,currentColor_1px,transparent_1px),linear-gradient(to_bottom,currentColor_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-3 pointer-events-none" />

      {/* "The Kick" White Flash Overlay */}
      <AnimatePresence>
        {showFlash && (
          form.theme === "dark_knight" ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0, 1, 0] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: "linear" }}
              className="fixed inset-0 bg-white z-50 pointer-events-none mix-blend-difference"
            />
          ) : form.theme === "tenet" && process.env.NEXT_PUBLIC_REFRESH_SECRET ? (
            <motion.div
              initial={{ opacity: 1, scale: 1.5 }}
              animate={{ opacity: 0, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeIn" }}
              className="fixed inset-0 bg-red-900 z-50 pointer-events-none mix-blend-color-burn"
            />
          ) : form.theme === "interstellar" ? (
             <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 2, ease: "easeOut" }}
              className="fixed inset-0 bg-black z-50 pointer-events-none"
            />
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
              className="fixed inset-0 bg-white z-50 pointer-events-none"
            />
          )
        )}
      </AnimatePresence>

      <div className={`w-full max-w-2xl border p-8 rounded-lg flex flex-col justify-between min-h-[460px] max-h-full relative bg-[var(--theme-surface)] border-[var(--theme-border)] shadow-[0_0_15px_var(--theme-border)] transition-all duration-300`}>
        
        {/* Top bar: Form Title & Totem */}
        <div className="flex items-center justify-between border-b border-current/10 pb-4 shrink-0">
          <div className="truncate">
            <h1 className="text-xl font-light font-cormorant tracking-wide truncate">
              {form.title}
            </h1>
            <p className="text-[8px] uppercase tracking-widest opacity-50 mt-0.5">
              DEPTH LEVEL: {currentLayerIndex + 1} / {layers.length}
            </p>
          </div>

          <div className="w-12 h-12 flex items-center justify-center">
            <Totem status={totemStatus} className="scale-[0.5]" />
          </div>
        </div>

        {/* Middle Area: Question Renderer with Framer Motion AnimatePresence */}
        <div className="flex-1 py-4 flex flex-col relative overflow-y-auto overflow-x-hidden min-h-[250px]">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentLayerIndex}
              custom={direction}
              variants={shouldReduceMotion ? reducedVariants : variants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="w-full flex flex-col space-y-10 pb-6"
            >
              {currentLayer && currentLayer.title && (
                <h2 className="text-xl font-light font-cormorant text-current/90 mb-2 tracking-wide border-b border-current/20 pb-3">{currentLayer.title}</h2>
              )}
              {currentLayer && currentLayer.fields.length > 0 ? (
                currentLayer.fields.map((field) => (
                  <FieldRenderer
                    key={field.id}
                    field={field}
                    value={answers[field.id]}
                    onChange={(val) => handleValueChange(field, val)}
                    error={errors[field.id]}
                  />
                ))
              ) : (
                <div className="text-center text-xs opacity-50 uppercase tracking-widest py-8">
                  Limbo detected: No parameters projected in this layer.
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Bottom Area: Progress & Controls */}
        <div className="border-t border-current/10 pt-4 flex flex-col space-y-4 shrink-0">
          <div className={form.theme === 'tenet' ? 'origin-right scale-x-[-1]' : ''}>
              <ProgressBar currentIndex={currentLayerIndex} total={layers.length} />
            </div>

          <div className="flex items-center justify-between">
            {/* Back button */}
            <button
              type="button"
              onClick={handleBack}
              disabled={currentLayerIndex === 0 || submitStatus === "submitting"}
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
              className={`px-5 py-2.5 rounded text-xs font-bold uppercase tracking-widest border transition-all cursor-pointer inline-flex items-center space-x-2 bg-[var(--theme-accent)] text-[var(--theme-bg)] border-[var(--theme-accent)] hover:opacity-90`}
            >
              {submitStatus === "submitting" ? (
                <>
                  <span>Syncing...</span>
                  <RefreshCw size={13} className="animate-spin" />
                </>
              ) : (
                <>
                  <span>{currentLayerIndex === layers.length - 1 ? "Stabilize" : "OK"}</span>
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
