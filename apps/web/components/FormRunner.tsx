"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { trpc } from "~/trpc/client";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, CornerDownLeft, RefreshCw, LogOut } from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Totem } from "./Totem";
import { ProgressBar } from "./ProgressBar";
import { FieldRenderer, FieldDefinition } from "./FieldRenderer";
import { z } from "zod";

export const isFieldVisible = (field: FieldDefinition, currentAnswers: Record<string, any>): boolean => {
  const logic = field.conditionalLogic as { rules?: Array<{ fieldId: string; operator: "equals" | "not_equals"; value: string; action: "show" | "hide" }> } | null;
  if (!logic || !logic.rules || logic.rules.length === 0) {
    return true;
  }

  let shouldShow = true;
  const hasShowRule = logic.rules.some((r) => r.action === "show");
  if (hasShowRule) {
    shouldShow = false;
  }

  for (const rule of logic.rules) {
    const targetVal = currentAnswers[rule.fieldId];
    const targetValStr = targetVal !== undefined && targetVal !== null ? String(targetVal) : "";
    const ruleValStr = String(rule.value);

    const matches = rule.operator === "equals"
      ? targetValStr === ruleValStr
      : targetValStr !== ruleValStr;

    if (rule.action === "show" && matches) {
      shouldShow = true;
    }
    if (rule.action === "hide" && matches) {
      shouldShow = false;
      break;
    }
  }

  return shouldShow;
};

const getLayerName = (idx: number): string => {
  const names = [
    "Reality (Layer 1)",
    "The Hotel (Layer 2)",
    "Snow Fortress (Layer 3)",
    "Limbo (Layer 4)",
  ];
  return names[idx] || `Limbo Deep (Layer ${idx + 1})`;
};

function buildZodSchemaForFields(fieldsToValidate: FieldDefinition[], currentAnswers: Record<string, any>) {
  const shape: Record<string, z.ZodTypeAny> = {};

  fieldsToValidate.forEach((field) => {
    if (!isFieldVisible(field, currentAnswers)) return;

    let fieldSchema: z.ZodTypeAny;

    switch (field.type) {
      case "short_text":
      case "long_text": {
        let stringSchema = z.string();
        const rules = field.validationRules as Record<string, any> | null;
        if (rules) {
          if (typeof rules.minLength === "number") stringSchema = stringSchema.min(rules.minLength, `Minimum length is ${rules.minLength}`);
          if (typeof rules.maxLength === "number") stringSchema = stringSchema.max(rules.maxLength, `Maximum length is ${rules.maxLength}`);
          if (typeof rules.pattern === "string" && rules.pattern) {
            try {
              stringSchema = stringSchema.regex(new RegExp(rules.pattern), "Format is invalid");
            } catch (e) {}
          }
        }
        if (field.required) {
          stringSchema = stringSchema.min(1, "This parameter is required to stabilize the layer.");
        }
        fieldSchema = stringSchema;
        break;
      }

      case "email": {
        let emailSchema = z.string();
        const rules = field.validationRules as Record<string, any> | null;
        if (rules) {
          if (typeof rules.minLength === "number") emailSchema = emailSchema.min(rules.minLength, `Minimum length is ${rules.minLength}`);
          if (typeof rules.maxLength === "number") emailSchema = emailSchema.max(rules.maxLength, `Maximum length is ${rules.maxLength}`);
          if (typeof rules.pattern === "string" && rules.pattern) {
            try {
              emailSchema = emailSchema.regex(new RegExp(rules.pattern), "Format is invalid");
            } catch (e) {}
          }
        }
        emailSchema = emailSchema.email("Invalid email coordinates.");
        if (field.required) {
          emailSchema = emailSchema.min(1, "This parameter is required to stabilize the layer.");
        }
        fieldSchema = emailSchema;
        break;
      }

      case "number": {
        let numSchema = z.coerce.number({ message: "Value must be a valid numeric coefficient." });
        const rules = field.validationRules as Record<string, any> | null;
        if (rules) {
          if (typeof rules.min === "number") numSchema = numSchema.min(rules.min, `Coefficient must be at least ${rules.min}.`);
          if (typeof rules.max === "number") numSchema = numSchema.max(rules.max, `Coefficient must be at most ${rules.max}.`);
        }
        fieldSchema = numSchema;
        break;
      }

      case "single_select": {
        let selectSchema = z.string({ message: "This parameter is required to stabilize the layer." });
        if (field.required) {
          selectSchema = selectSchema.min(1, "This parameter is required to stabilize the layer.");
        }
        fieldSchema = selectSchema;
        break;
      }

      case "multi_select": {
        let selectSchema = z.array(z.string());
        if (field.required) {
          selectSchema = selectSchema.min(1, "At least one selection is required.");
        }
        fieldSchema = selectSchema;
        break;
      }

      case "rating": {
        let maxVal = 5;
        const opts = field.options;
        if (typeof opts === "number") {
          maxVal = opts;
        } else if (Array.isArray(opts) && opts.length > 0) {
          maxVal = Number(opts[0]) || 5;
        } else if (opts && typeof opts === "object" && !Array.isArray(opts)) {
          maxVal = (opts as Record<string, unknown>).max as number || 5;
        }
        fieldSchema = z.coerce.number().min(1, "Rating must be at least 1.").max(maxVal, `Rating must be at most ${maxVal}.`);
        break;
      }

      case "date": {
        let dateSchema = z.string();
        if (field.required) {
          dateSchema = dateSchema.min(1, "This parameter is required to stabilize the layer.");
        }
        fieldSchema = dateSchema;
        break;
      }

      case "checkbox": {
        let checkSchema = z.boolean();
        if (field.required) {
          checkSchema = checkSchema.refine((val) => val === true, "You must confirm this parameter.");
        }
        fieldSchema = checkSchema;
        break;
      }

      default:
        fieldSchema = z.any();
    }

    shape[field.id] = field.required ? fieldSchema : fieldSchema.optional().nullable().or(z.literal("")).or(z.undefined());
  });

  return z.object(shape);
}

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
    const groups: Record<number, FieldDefinition[]> = {};
    fields.forEach((field) => {
      if (field.type === "layer_break") return;
      const pIdx = field.pageIndex ?? 0;
      if (!groups[pIdx]) {
        groups[pIdx] = [];
      }
      groups[pIdx].push(field);
    });

    const sortedPageIndices = Object.keys(groups)
      .map(Number)
      .sort((a, b) => a - b);

    if (sortedPageIndices.length === 0) {
      return [{ title: "Reality (Layer 1)", fields: [] }];
    }

    return sortedPageIndices.map((idx) => ({
      title: getLayerName(idx),
      fields: groups[idx] || [],
    }));
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

  const handleValueChange = (field: FieldDefinition, val: any) => {
    const newAnswers = { ...answers, [field.id]: val };
    setAnswers(newAnswers);
    
    // Clear validation error dynamically if it becomes valid
    if (errors[field.id]) {
      const pageSchema = buildZodSchemaForFields([field], newAnswers);
      const parseResult = pageSchema.safeParse(newAnswers);
      setErrors((prev) => {
        const updated = { ...prev };
        if (parseResult.success) {
          delete updated[field.id];
        } else {
          const err = parseResult.error.issues.find((e: any) => e.path[0] === field.id);
          if (err) {
            updated[field.id] = err.message;
          } else {
            delete updated[field.id];
          }
        }
        return updated;
      });
    }
  };

  const handleNext = () => {
    if (!currentLayer) return;

    // Filter visible fields on this layer
    const visibleFields = currentLayer.fields.filter(f => isFieldVisible(f, answers));
    
    const pageSchema = buildZodSchemaForFields(visibleFields, answers);
    const parseResult = pageSchema.safeParse(answers);

    if (!parseResult.success) {
      const newErrors: Record<string, string> = { ...errors };
      
      // Clear errors of current layer fields first
      currentLayer.fields.forEach((f) => delete newErrors[f.id]);
      
      // Set new errors
      parseResult.error.issues.forEach((err: any) => {
        const fieldId = err.path[0] as string;
        if (fieldId) {
          newErrors[fieldId] = err.message;
        }
      });
      
      setErrors(newErrors);
      toast.error("Please stabilize all parameters in this layer before proceeding.");
      return;
    }

    // Clear validation errors for this layer
    setErrors((prev) => {
      const updated = { ...prev };
      currentLayer.fields.forEach((f) => delete updated[f.id]);
      return updated;
    });

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

    // Filter only visible answers for submission
    const visibleAnswers: Record<string, any> = {};
    fields.forEach((field) => {
      if (isFieldVisible(field, answers)) {
        visibleAnswers[field.id] = answers[field.id];
      }
    });

    try {
      if (isPreview && onSimulateSubmit) {
        onSimulateSubmit(visibleAnswers);
        await new Promise((resolve) => setTimeout(resolve, 800));
      } else {
        await submitMutation.mutateAsync({
          formId: form.id,
          data: visibleAnswers,
          password: passcode,
          timeToComplete: elapsedSeconds,
        });
      }

      // Submit success: trigger "kick/flash" effect & totem deceleration
      setSubmitStatus("success");
      setTotemStatus("decelerating");
      setShowFlash(true);
      toast.success("Projection parameters synchronized successfully.");
      
      if (new Date().getHours() === 0) {
        import("~/lib/achievements").then(m => m.unlockAchievement("midnight_submission"));
      }

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
    <div
      className={`skin-${form.theme} min-h-screen bg-[var(--theme-bg)] text-[var(--theme-text)] flex flex-col items-center justify-center p-6 md:p-8 font-mono relative`}
    >
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
              {new Date().getHours() === 0 ? <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 4, repeat: Infinity }}>You submitted at the hour of limbo.</motion.span> : "Projection Stabilized"}
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
    <div
      className={`skin-${form.theme} min-h-screen bg-[var(--theme-bg)] text-[var(--theme-text)] flex flex-col items-center justify-center p-6 md:p-8 font-mono relative overflow-hidden`}
    >
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
                currentLayer.fields.map((field) => {
                  if (!isFieldVisible(field, answers)) return null;
                  return (
                    <FieldRenderer
                      key={field.id}
                      field={field}
                      value={answers[field.id]}
                      onChange={(val) => handleValueChange(field, val)}
                      error={errors[field.id]}
                    />
                  );
                })
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
              <ProgressBar currentIndex={currentLayerIndex} total={layers.length} mode="nodes" />
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
