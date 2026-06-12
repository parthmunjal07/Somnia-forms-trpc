"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "~/lib/store";
import { trpc } from "~/trpc/client";
import { toast } from "sonner";
import { ThemePicker } from "~/components/ThemePicker";
import { FormRunner } from "~/components/FormRunner";
import { FORM_TEMPLATES } from "~/lib/templates";
import {
  GripVertical,
  Sliders,
  Trash2,
  Plus,
  Monitor,
  Smartphone,
  Play,
  Lock,
  ArrowLeft,
  Info,
  Sparkles,
  Settings,
  Users,
  SeparatorHorizontal,
  MousePointer
} from "lucide-react";

// DND-Kit Imports
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";

// Draggable Field wrapper component for DndKit
function SortableFieldRow({
  field,
  activeId,
  onSelect,
  onDelete,
  disabled,
  isShifting,
}: {
  field: any;
  activeId: string | null;
  onSelect: (field: any) => void;
  onDelete: (id: string) => void;
  disabled: boolean;
  isShifting?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: field.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-center justify-between border rounded p-3 transition-all text-sm ${
        field.type === "layer_break"
          ? "bg-emerald-950/20 border-emerald-900/50 border-dashed"
          : "bg-stone-950/30"
      } ${
        activeId === field.id
          ? field.type === "layer_break"
            ? "border-emerald-500/80 bg-emerald-900/40"
            : "border-emerald-500/80 bg-emerald-950/10"
          : "border-stone-850 hover:border-stone-700/60"
      }`}
    >
      <div className="flex items-center space-x-3 overflow-hidden flex-1">
        {/* Drag handle */}
        <button
          type="button"
          disabled={disabled}
          {...attributes}
          {...listeners}
          className={`p-1.5 transition-all duration-500 cursor-grab active:cursor-grabbing ${
            isShifting 
              ? "text-[#E8B455] drop-shadow-[0_0_8px_#E8B455] scale-125" 
              : "text-stone-600 group-hover:text-stone-400"
          } ${disabled ? "opacity-30 cursor-not-allowed" : ""}`}
        >
          <GripVertical size={16} />
        </button>

        <div className="truncate flex-1">
          <p className={`font-semibold truncate text-sm ${field.type === "layer_break" ? "text-emerald-400" : "text-stone-200"}`}>{field.label}</p>
          <p className="text-xs text-stone-500 uppercase tracking-widest mt-0.5">
            {field.type === "layer_break" ? "LAYER BREAK / SECTION" : `${field.type.replace("_", " ")} ${field.required ? "*" : ""}`}
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-1.5 ml-2">
        <button
          type="button"
          onClick={() => onSelect(field)}
          className="p-2 text-stone-400 hover:text-white rounded hover:bg-stone-900 transition-colors"
        >
          <Sliders size={14} />
        </button>
        <button
          type="button"
          onClick={() => {
            if (disabled) return;
            onDelete(field.id);
          }}
          disabled={disabled}
          className={`p-2 text-stone-400 hover:text-red-400 rounded hover:bg-stone-900 transition-colors ${disabled ? "opacity-30 cursor-not-allowed" : ""
            }`}
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

function FieldAddBtn({ onClick, label, desc, isLayerBreak }: any) {
  return (
    <button
      onClick={onClick}
      className={`flex items-start gap-3 p-2.5 text-left rounded-sm transition-all border ${
        isLayerBreak 
          ? "border-emerald-900/50 bg-emerald-950/20 hover:border-emerald-500/80 hover:bg-emerald-900/40 border-dashed" 
          : "border-transparent hover:border-[rgba(200,216,232,0.08)] hover:bg-[rgba(200,216,232,0.02)] bg-transparent"
      }`}
    >
      {isLayerBreak ? <SeparatorHorizontal size={14} className="text-emerald-500 mt-0.5 flex-shrink-0" /> : <Plus size={14} className="text-[#C9933A]/60 mt-0.5 flex-shrink-0" />}
      <div>
        <p className={`text-[16px] font-medium ${isLayerBreak ? "text-emerald-400" : "text-[#C8D8E8]"}`}>{label}</p>
        <p className="text-[14px] text-[rgba(139,163,191,0.4)] mt-0.5">{desc}</p>
      </div>
    </button>
  );
}

export default function BuildPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const { user, setUser } = useAuthStore();
  const utils = trpc.useUtils();

  // Load Form Data & Fields
  const { data: form, isLoading: isFormLoading } = trpc.forms.getById.useQuery({ id });
  const { data: fieldsData, isLoading: isFieldsLoading } = trpc.fields.list.useQuery({ formId: id });
  const { data: collaborators, isLoading: isCollabLoading } = trpc.collaborators.list.useQuery({ formId: id });

  // Local state for layout/panels configuration
  const [fields, setFields] = useState<any[]>([]);
  const [selectedField, setSelectedField] = useState<any | null>(null);
  const [activeRightTab, setActiveRightTab] = useState<"edit" | "settings" | "collab">("edit");

  // Mobile Layout Tab
  const [mobileTab, setMobileTab] = useState<"fields" | "preview" | "settings">("preview");

  // Custom Sidebar Settings States
  const [themeSkin, setThemeSkin] = useState("classic-dark");
  const [formSlug, setFormSlug] = useState("");
  const [responseLimit, setResponseLimit] = useState<number | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [formPassword, setFormPassword] = useState("");
  const [thankYouMessage, setThankYouMessage] = useState("");

  // Collaborator Invite fields
  const [collabEmail, setCollabEmail] = useState("");
  const [collabRole, setCollabRole] = useState<"THE_FORGER" | "THE_SHADE">("THE_SHADE");

  // Preview options
  const [viewportWidth, setViewportWidth] = useState<"desktop" | "mobile">("desktop");
  const [isSandboxMode, setIsSandboxMode] = useState(false);
  const [sandboxSubmission, setSandboxSubmission] = useState<any | null>(null);

  // Easter egg tracking
  const [dragTimestamps, setDragTimestamps] = useState<number[]>([]);
  const [isShifting, setIsShifting] = useState(false);

  // Onboarding Spotlight
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Track if changes have been made to a published form
  const [hasUnpublishedEdits, setHasUnpublishedEdits] = useState(false);

  useEffect(() => {
    if (!isFieldsLoading && fields.length === 0 && !localStorage.getItem("somnia_builder_seen")) {
      setShowOnboarding(true);
    }
  }, [isFieldsLoading, fields.length]);

  useEffect(() => {
    if (fields.length > 0 && showOnboarding) {
      setShowOnboarding(false);
      localStorage.setItem("somnia_builder_seen", "true");
    }
  }, [fields.length, showOnboarding]);

  // Sync loaded database state to local hooks
  useEffect(() => {
    if (fieldsData) setFields(fieldsData);
  }, [fieldsData]);

  useEffect(() => {
    if (form) {
      setThemeSkin(form.theme ?? "classic-dark");
      setFormSlug(form.slug ?? "");
      setResponseLimit(form.responseLimit ?? null);
      setExpiresAt(form.expiresAt ? new Date(form.expiresAt).toISOString().slice(0, 10) : null);
      setThankYouMessage(form.thankYouMessage ?? "");
    }
  }, [form]);

  // Determine User Role for layout restrictions
  const userRoleOnForm = form
    ? form.userId === user?.id
      ? "THE_ARCHITECT"
      : (collaborators?.find((c: any) => c.userId === user?.id)?.role ?? "THE_SHADE")
    : "THE_SHADE";

  const isArchitect = userRoleOnForm === "THE_ARCHITECT";
  const isForger = userRoleOnForm === "THE_FORGER";
  const isShade = userRoleOnForm === "THE_SHADE";
  const isReadOnly = isShade;

  // tRPC Mutations
  const updateFormMutation = trpc.forms.update.useMutation({
    onSuccess: () => {
      setHasUnpublishedEdits(true);
      utils.forms.getById.invalidate({ id });
      utils.forms.list.invalidate();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to update variables.");
    },
  });

  // UX Fix: Debounced Auto-Save
  useEffect(() => {
    if (isReadOnly || !form) return;
    const timer = setTimeout(() => {
      const dbExpiresAt = form.expiresAt ? new Date(form.expiresAt).toISOString().slice(0, 10) : null;
      if (
        themeSkin !== (form.theme ?? "classic-dark") ||
        formSlug !== (form.slug ?? "") ||
        responseLimit !== (form.responseLimit ?? null) ||
        expiresAt !== dbExpiresAt ||
        thankYouMessage !== (form.thankYouMessage ?? "")
      ) {
        updateFormMutation.mutate({
          id,
          theme: themeSkin,
          slug: formSlug,
          responseLimit: responseLimit ? Number(responseLimit) : null,
          expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
          password: formPassword || undefined,
          thankYouMessage: thankYouMessage || null,
        });
        toast.success("Settings synchronized.");
      }
    }, 1000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [themeSkin, formSlug, responseLimit, expiresAt, formPassword, thankYouMessage, form, isReadOnly, id]);

  const createFieldMutation = trpc.fields.create.useMutation({
    onSuccess: () => {
      setHasUnpublishedEdits(true);
      toast.success("Field projection inserted.");
      utils.fields.list.invalidate({ formId: id });
    },
    onError: (err) => toast.error(err.message || "Failed to insert field."),
  });

  const updateFieldMutation = trpc.fields.update.useMutation({
    onSuccess: () => {
      setHasUnpublishedEdits(true);
      utils.fields.list.invalidate({ formId: id })
    },
    onError: (err) => toast.error(err.message || "Field configuration failed."),
  });

  const deleteFieldMutation = trpc.fields.delete.useMutation({
    onSuccess: () => {
      setHasUnpublishedEdits(true);
      utils.fields.list.invalidate({ formId: id });
    },
    onError: (err) => toast.error(err.message || "Failed to collapse field."),
  });

  const handleDeleteField = (fId: string) => {
    if (isReadOnly) return;
    const fieldToDelete = fields.find((f) => f.id === fId);
    if (!fieldToDelete) return;
    
    // Optimistic remove
    setFields((prev) => prev.filter((f) => f.id !== fId));
    if (selectedField?.id === fId) setSelectedField(null);
    
    let isUndone = false;
    toast("Question removed.", {
      action: {
        label: "Undo",
        onClick: () => {
          isUndone = true;
          setFields((prev) => [...prev, fieldToDelete].sort((a, b) => a.order - b.order));
        }
      },
      duration: 4000,
      onDismiss: () => {
        if (!isUndone) {
          deleteFieldMutation.mutate({ id: fId, formId: id });
        }
      }
    });
  };

  const reorderFieldsMutation = trpc.fields.reorder.useMutation({
    onSuccess: () => {
      setHasUnpublishedEdits(true);
      utils.fields.list.invalidate({ formId: id })
    },
    onError: (err) => toast.error(err.message || "Reordering sequence failed."),
  });

  const inviteCollaboratorMutation = trpc.collaborators.invite.useMutation({
    onSuccess: () => {
      toast.success("Collaborator identity accepted into Dreamscape.");
      setCollabEmail("");
      utils.collaborators.list.invalidate({ formId: id });
    },
    onError: (err) => toast.error(err.message || "Failed to establish team access."),
  });

  const removeCollaboratorMutation = trpc.collaborators.remove.useMutation({
    onSuccess: () => {
      toast.success("Collaborator access severed.");
      utils.collaborators.list.invalidate({ formId: id });
    },
    onError: (err) => toast.error(err.message || "Removal request failed."),
  });

  const upgradeTierMutation = trpc.auth.upgradeTier.useMutation({
    onSuccess: () => {
      toast.success("Tier upgrade accepted. Welcome to the Team level.");
      if (user) setUser({ ...user, subscriptionTier: "pro" });
      utils.collaborators.list.invalidate({ formId: id });
    },
    onError: (err) => toast.error(err.message || "Upgrade payment rejected."),
  });

  const sensors = useSensors(useSensor(PointerSensor));

  const handleDragEnd = (event: DragEndEvent) => {
    if (isReadOnly) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = fields.findIndex((f) => f.id === active.id);
    const newIndex = fields.findIndex((f) => f.id === over.id);

    const reordered = arrayMove(fields, oldIndex, newIndex);
    setFields(reordered);

    reorderFieldsMutation.mutate({
      formId: id,
      fieldIds: reordered.map((f) => f.id),
    });

    // Easter egg check
    const now = Date.now();
    const recentDrags = [...dragTimestamps, now].filter((t) => now - t <= 10000);
    setDragTimestamps(recentDrags);

    if (recentDrags.length === 5) {
      setIsShifting(true);
      import("~/lib/achievements").then(m => m.unlockAchievement("architecture_shifting"));
      toast("The architecture is shifting.", {
        style: { background: "#C9933A", color: "#000", border: "none", fontWeight: "bold" },
        duration: 3000
      });
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = "sine";
        osc.frequency.setValueAtTime(392.00, audioCtx.currentTime); // G4
        gain.gain.setValueAtTime(0, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0.5, audioCtx.currentTime + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 4);
        osc.start(audioCtx.currentTime);
        osc.stop(audioCtx.currentTime + 4);
      } catch (e) {}

      setTimeout(() => setIsShifting(false), 3000);
    }
  };

  const handleAddField = (type: string) => {
    if (isReadOnly) return;
    const maxOrder = fields.length > 0 ? Math.max(...fields.map((f) => f.order)) : 0;
    createFieldMutation.mutate({
      formId: id,
      label: type === "layer_break" ? "New Layer / Section" : `New ${type.replace("_", " ")} label`,
      type: type as any,
      required: false,
      order: maxOrder + 1,
      options: ["single_select", "multi_select", "checkbox"].includes(type)
        ? ["Option 1", "Option 2", "Option 3"]
        : null,
    });
  };

  const handleLoadTemplate = (templateKey: keyof typeof FORM_TEMPLATES) => {
    if (isReadOnly) return;
    const templateFields = FORM_TEMPLATES[templateKey];
    
    // Auto-incrementing order starting from current maxOrder
    const maxOrder = fields.length > 0 ? Math.max(...fields.map((f: any) => f.order)) : -1;
    
    templateFields.forEach((field, index) => {
      createFieldMutation.mutate({
        formId: id,
        label: field.label,
        type: field.type as any,
        required: field.required,
        order: maxOrder + 1 + index,
        options: field.options,
      });
    });
  };

  const handleFieldChange = (key: string, value: any) => {
    if (!selectedField || isReadOnly) return;
    const updated = { ...selectedField, [key]: value };
    setSelectedField(updated);

    updateFieldMutation.mutate({
      id: selectedField.id,
      formId: id,
      [key]: value,
    });
  };

  return (
    <div className="min-h-[100dvh] h-screen bg-stone-950 text-stone-200 font-mono flex flex-col selection:bg-emerald-500/20 overflow-hidden relative">

      {/* Onboarding Spotlight Overlay */}
      {showOnboarding && (
        <div className="absolute inset-0 z-[100] pointer-events-none flex">
          <div className="w-full lg:w-80 h-full shadow-[0_0_0_9999px_rgba(10,10,15,0.7)] bg-transparent relative">
            <div className="hidden lg:flex absolute right-[-280px] top-40 items-center gap-4 text-[#C9933A] drop-shadow-[0_0_8px_rgba(201,147,58,0.5)]">
              <ArrowLeft size={24} className="animate-bounce" />
              <span className="font-semibold tracking-wider text-lg uppercase">Start by adding your first token</span>
            </div>
            <div className="flex lg:hidden absolute bottom-[-60px] left-1/2 -translate-x-1/2 flex-col items-center gap-2 text-[#C9933A] drop-shadow-[0_0_8px_rgba(201,147,58,0.5)]">
               <span className="font-semibold tracking-wider text-md uppercase text-center w-48">Start by adding your first token</span>
            </div>
          </div>
        </div>
      )}

      {/* Top Header bar */}
      <header className="bg-stone-900/60 backdrop-blur-xl border-b border-stone-850 px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-4 z-40 shrink-0">
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <button
            onClick={() => router.push("/dashboard")}
            className="p-2 rounded border border-stone-800 text-stone-500 hover:text-stone-300 hover:border-stone-700 transition-all cursor-pointer"
          >
            <ArrowLeft size={16} />
          </button>

          <div className="truncate">
            <h1 className="text-lg font-semibold text-stone-100 truncate font-cormorant tracking-wide">
              {form?.title ?? "Dreamscape Builder"}
            </h1>
            <p className="text-sm text-stone-500 uppercase tracking-widest mt-0.5">
              Role: {userRoleOnForm.replace("THE_", "")} / Path: /f/{formSlug}
            </p>
          </div>
        </div>

        {/* Viewport switchers + Sandbox toggle */}
        <div className="flex items-center space-x-4 w-full sm:w-auto overflow-x-auto justify-end">
          <div className="bg-stone-950 p-1 rounded border border-stone-850 flex items-center space-x-1 shrink-0">
            <button
              onClick={() => setViewportWidth("desktop")}
              className={`p-2 rounded transition-all cursor-pointer ${viewportWidth === "desktop" ? "bg-stone-800 text-emerald-400" : "text-stone-500 hover:text-stone-300"
                }`}
            >
              <Monitor size={16} />
            </button>
            <button
              onClick={() => setViewportWidth("mobile")}
              className={`p-2 rounded transition-all cursor-pointer ${viewportWidth === "mobile" ? "bg-stone-800 text-emerald-400" : "text-stone-500 hover:text-stone-300"
                }`}
            >
              <Smartphone size={16} />
            </button>
          </div>

          <button
            onClick={() => {
              setIsSandboxMode(!isSandboxMode);
              setSandboxSubmission(null);
            }}
            className={`flex items-center space-x-2 px-3 py-2 rounded text-xs uppercase font-bold tracking-wider border transition-all cursor-pointer shrink-0 ${isSandboxMode
                ? "bg-emerald-950/20 border-emerald-500 text-emerald-400"
                : "bg-stone-950 border-stone-850 text-stone-500 hover:text-stone-300"
              }`}
          >
            <Play size={12} />
            <span className="hidden sm:inline">Sandbox: {isSandboxMode ? "ON" : "OFF"}</span>
          </button>

          {/* Analytics Transition Button */}
          {!isShade ? (
            <button
              onClick={() => router.push(`/dashboard/forms/${id}/analytics`)}
              className="flex items-center space-x-1.5 px-3 py-2 bg-amber-950/20 hover:bg-amber-900/30 border border-amber-900/40 hover:border-amber-500 text-amber-400 rounded text-sm uppercase font-bold tracking-widest transition-all cursor-pointer shrink-0"
            >
              <span>Analytics</span>
            </button>
          ) : (
            <button
              disabled
              title="THE_SHADE is blocked from viewing analytics"
              className="flex items-center space-x-1.5 px-3 py-2 bg-stone-950/50 border border-stone-900 text-stone-600 rounded text-sm uppercase font-bold tracking-widest cursor-not-allowed opacity-45 shrink-0"
            >
              <span>Analytics</span>
            </button>
          )}

          {/* Publish / Status Toggle */}
          <div className="flex items-center space-x-2 shrink-0">
            {form?.status === "published" && (
              <button 
                onClick={() => {
                  if (isForger || isReadOnly) return;
                  updateFormMutation.mutate({ id, status: "draft" });
                  setHasUnpublishedEdits(false);
                }} 
                disabled={isForger || isReadOnly}
                className={`text-[10px] text-stone-500 hover:text-stone-300 px-2 transition-colors uppercase tracking-widest font-semibold ${isForger || isReadOnly ? "hidden" : ""}`}
                title="Revert to Draft (Unpublish)"
              >
                Unpublish
              </button>
            )}
            <div className="flex items-center border border-stone-850 rounded bg-stone-950 p-0.5">
              <button
                onClick={() => {
                  if (isForger) {
                    toast.error("Forgers do not hold publishing keys.");
                    return;
                  }
                  if (isReadOnly) return;

                  if (form?.status === "published") {
                    setHasUnpublishedEdits(false);
                    toast.success("Live form updated successfully!");
                  } else {
                    updateFormMutation.mutate({
                      id,
                      status: "published",
                    });
                    setHasUnpublishedEdits(false);
                  }
                }}
                disabled={isForger || isReadOnly || (form?.status === "published" && !hasUnpublishedEdits)}
                className={`px-4 py-2 rounded text-sm uppercase font-bold tracking-widest transition-all cursor-pointer 
                  ${form?.status === "published" && !hasUnpublishedEdits
                    ? "bg-stone-900 text-emerald-500/50 border border-transparent cursor-default"
                    : form?.status === "published" && hasUnpublishedEdits
                    ? "bg-emerald-950/30 text-emerald-400 border border-emerald-900/60 shadow-[0_0_10px_rgba(16,185,129,0.1)]"
                    : "text-stone-500 hover:text-stone-300 border border-transparent"
                  } ${isForger || isReadOnly ? "opacity-35 cursor-not-allowed" : ""}`}
              >
                {form?.status === "published" 
                  ? (hasUnpublishedEdits ? "Update Form" : "Published") 
                  : "Publish Form"}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Segmented Navigation */}
      <div className="flex lg:hidden bg-stone-900 border-b border-stone-850 p-2 gap-2 z-30 shrink-0">
        <button onClick={() => setMobileTab("fields")} className={`flex-1 py-2.5 text-sm font-bold uppercase tracking-wider rounded transition-colors ${mobileTab === "fields" ? "bg-emerald-950/50 text-emerald-400 border border-emerald-900/50" : "text-stone-400 hover:bg-stone-800"}`}>Fields</button>
        <button onClick={() => setMobileTab("preview")} className={`flex-1 py-2.5 text-sm font-bold uppercase tracking-wider rounded transition-colors ${mobileTab === "preview" ? "bg-emerald-950/50 text-emerald-400 border border-emerald-900/50" : "text-stone-400 hover:bg-stone-800"}`}>Preview</button>
        <button onClick={() => setMobileTab("settings")} className={`flex-1 py-2.5 text-sm font-bold uppercase tracking-wider rounded transition-colors ${mobileTab === "settings" ? "bg-emerald-950/50 text-emerald-400 border border-emerald-900/50" : "text-stone-400 hover:bg-stone-800"}`}>Settings</button>
      </div>

      {/* Main Builder Panels */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">

        {/* READ ONLY BANNER */}
        {isReadOnly && (
          <div className="absolute top-0 left-0 right-0 z-20 bg-amber-950/40 border-b border-amber-900/40 text-amber-500 text-sm py-2 px-6 flex items-center justify-center space-x-2 tracking-widest uppercase animate-pulse font-bold">
            <Info size={14} />
            <span className="text-center">Observer Mode: Configuration is strictly read-only</span>
          </div>
        )}

        {/* LEFT PANEL: Fields List Panel */}
        <section className={`w-full lg:w-80 bg-stone-900/25 border-b lg:border-b-0 lg:border-r border-stone-850 flex flex-col overflow-hidden ${mobileTab === "fields" ? "flex" : "hidden"} lg:flex ${isReadOnly ? "pt-12" : ""}`}>
          
          <div className="flex-1 overflow-y-auto scrollbar-hide p-5 flex flex-col space-y-5">
            <div className="flex flex-col space-y-1.5 shrink-0">
              <h2 className="text-lg font-semibold tracking-wider text-stone-300 uppercase">
                Dream Fields
              </h2>
              <p className="text-md text-stone-600 uppercase tracking-widest">
                Drag-and-drop structural tokens
              </p>
            </div>
            
            {/* Add Field Actions */}
            {!isReadOnly && (
              <div className="flex flex-col shrink-0">
                <div className="flex flex-col gap-4">
                  <div>
                    <p className="text-[18px] text-[rgba(139,163,191,0.35)] tracking-[0.2em] uppercase mb-2">Text Fields</p>
                    <div className="flex flex-col gap-1">
                      <FieldAddBtn onClick={() => handleAddField("short_text")} label="Short text" desc="One line answer" />
                      <FieldAddBtn onClick={() => handleAddField("long_text")} label="Long text" desc="Paragraph answer" />
                      <FieldAddBtn onClick={() => handleAddField("email")} label="Email" desc="Validated email" />
                    </div>
                  </div>

                  <div>
                    <p className="text-[18px] text-[rgba(139,163,191,0.35)] tracking-[0.2em] uppercase mb-2">Choices</p>
                    <div className="flex flex-col gap-1">
                      <FieldAddBtn onClick={() => handleAddField("single_select")} label="Select one" desc="Pick one from a list" />
                      <FieldAddBtn onClick={() => handleAddField("multi_select")} label="Select many" desc="Pick multiple" />
                      <FieldAddBtn onClick={() => handleAddField("checkbox")} label="Checkbox" desc="Yes / No toggle" />
                    </div>
                  </div>

                  <div>
                    <p className="text-[18px] text-[rgba(139,163,191,0.35)] tracking-[0.2em] uppercase mb-2">Numbers & Scale</p>
                    <div className="flex flex-col gap-1">
                      <FieldAddBtn onClick={() => handleAddField("number")} label="Number" desc="Any numeric value" />
                      <FieldAddBtn onClick={() => handleAddField("rating")} label="Rating" desc="Star or scale (1–5)" />
                    </div>
                  </div>

                  <div>
                    <p className="text-[18px] text-[rgba(139,163,191,0.35)] tracking-[0.2em] uppercase mb-2">Other</p>
                    <div className="flex flex-col gap-1">
                      <FieldAddBtn onClick={() => handleAddField("date")} label="Date" desc="Date picker" />
                      <FieldAddBtn onClick={() => handleAddField("layer_break")} label="Layer break" desc="Start a new page" isLayerBreak />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Field Draggable Rows list */}
            <div className="flex-1 pt-2 pb-6">
              {isFieldsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="h-12 bg-stone-900/30 border border-stone-900 rounded animate-pulse" />
                  ))}
                </div>
              ) : fields.length > 0 ? (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  modifiers={[restrictToVerticalAxis]}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext items={fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-3">
                      {fields.map((field) => (
                        <SortableFieldRow
                          key={field.id}
                          field={field}
                          activeId={selectedField?.id ?? null}
                          onSelect={(f) => {
                            setSelectedField(f);
                            setActiveRightTab("edit");
                            setMobileTab("settings"); // Auto jump on mobile
                          }}
                          onDelete={(fId) => handleDeleteField(fId)}
                          disabled={isReadOnly}
                          isShifting={isShifting}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              ) : (
                /* Templates Hero Empty State */
                <div className="flex flex-col gap-3 mt-4">
                  <p className="text-[18px] text-[rgba(139,163,191,0.35)] tracking-[0.2em] uppercase mb-1">
                    Start from a template
                  </p>
                  {[
                    { key: "feedback",          label: "Feedback form",       desc: "Rating + open text" },
                    { key: "job_application",   label: "Job application",     desc: "Contact + screening Qs" },
                    { key: "event_registration",label: "Event registration",  desc: "Name + email + RSVP" },
                  ].map((t) => (
                    <button key={t.key} onClick={() => handleLoadTemplate(t.key as any)}
                      className="flex items-start gap-3 p-3 text-left rounded-md transition-all"
                      style={{ border: "0.5px solid rgba(200,216,232,0.08)", background: "rgba(200,216,232,0.02)" }}>
                      <Plus size={14} className="text-[#C9933A]/60 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-[15px] text-[#C8D8E8] font-medium">{t.label}</p>
                        <p className="text-[15px] text-[rgba(139,163,191,0.4)] mt-0.5">{t.desc}</p>
                      </div>
                    </button>
                  ))}
                  <p className="text-[16px] text-[rgba(139,163,191,0.35)] tracking-[0.2em] uppercase text-center mt-2">
                    Click any field type above to begin
                  </p>
                  <div className="flex items-center gap-2 my-2">
                    <div className="flex-1 h-px bg-[rgba(200,216,232,0.06)]" />
                    <span className="text-[14px] text-[rgba(139,163,191,0.25)] uppercase tracking-widest">or build from scratch</span>
                    <div className="flex-1 h-px bg-[rgba(200,216,232,0.06)]" />
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* PROGRESS FOOTER */}
          <div className="flex-shrink-0 p-4 border-t border-[rgba(200,216,232,0.06)] bg-stone-950/20">
            {fields.length === 0 && (
              <p className="text-[17px] text-[rgba(139,163,191,0.4)] text-center leading-relaxed">
                Add at least one question to get started.
              </p>
            )}
            {fields.length > 0 && fields.length < 3 && (
              <p className="text-[15px] text-[rgba(201,147,58,0.6)] text-center leading-relaxed">
                Good start. Most forms have 3–7 questions.
              </p>
            )}
            {fields.length >= 3 && form?.status !== "published" && (
              <button
                onClick={() => updateFormMutation.mutate({ id, status: "published" })}
                className="w-full py-2.5 text-[10px] font-bold tracking-[0.14em] uppercase rounded-sm transition-all hover:bg-[rgba(201,147,58,0.15)]"
                style={{ background: "rgba(201,147,58,0.1)", border: "0.5px solid rgba(201,147,58,0.35)", color: "#C9933A" }}
              >
                Ready to publish →
              </button>
            )}
            {form?.status === "published" && (
              <div className="flex items-center justify-center gap-2 text-[15px] text-[rgba(74,255,158,0.6)]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#4AFF9E] animate-pulse" />
                Live — share your form
              </div>
            )}
          </div>
        </section>

        {/* CENTER PANEL: Live Interactive Form Preview */}
        <section className={`flex-1 bg-stone-950 items-center justify-center p-6 md:p-8 overflow-y-auto scrollbar-hide ${mobileTab === "preview" ? "flex" : "hidden"} lg:flex ${isReadOnly ? "pt-14" : ""}`}>
          <div
            className={`w-full h-full transition-all duration-300 flex flex-col justify-center ${viewportWidth === "mobile" ? "max-w-[375px]" : "max-w-2xl"
              }`}
          >
            {/* Real Form Preview */}
            <div className="w-full h-full flex flex-col relative rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]">
              <FormRunner
                form={{ ...(form as any), theme: themeSkin }}
                fields={fields}
                isPreview={true}
                onSimulateSubmit={(data: Record<string, any>) => {
                  if (isSandboxMode) {
                    setSandboxSubmission(data);
                    setActiveRightTab("edit");
                    setMobileTab("settings");
                    toast.success("Test response captured — see right panel.");
                  }
                }}
              />
            </div>
          </div>
        </section>

        {/* RIGHT PANEL: Configuration / Settings / Collaborators sidebar */}
        <section className={`w-full lg:w-[340px] bg-stone-900/25 border-t lg:border-t-0 lg:border-l border-stone-850 flex-col overflow-hidden ${mobileTab === "settings" ? "flex" : "hidden"} lg:flex ${isReadOnly ? "pt-12" : ""}`}>

          {/* Tabs bar */}
          <div className="flex border-b border-stone-850 text-xs tracking-wider font-semibold relative bg-stone-950/20 shrink-0">
            <button
              onClick={() => setActiveRightTab("edit")}
              className={`flex-1 py-4 text-center transition-colors uppercase cursor-pointer ${activeRightTab === "edit" ? "text-stone-100 font-bold" : "text-stone-500 hover:text-stone-300"
                }`}
            >
              <Sliders size={14} className="inline mr-1.5 mb-0.5" />
              Field
            </button>
            <button
              onClick={() => setActiveRightTab("settings")}
              className={`flex-1 py-4 text-center transition-colors uppercase cursor-pointer ${activeRightTab === "settings" ? "text-stone-100 font-bold" : "text-stone-500 hover:text-stone-300"
                }`}
            >
              <Settings size={14} className="inline mr-1.5 mb-0.5" />
              Settings
            </button>
            <button
              onClick={() => setActiveRightTab("collab")}
              className={`flex-1 py-4 text-center transition-colors uppercase cursor-pointer ${activeRightTab === "collab" ? "text-stone-100 font-bold" : "text-stone-500 hover:text-stone-300"
                }`}
            >
              <Users size={14} className="inline mr-1.5 mb-0.5" />
              Team
            </button>

            {/* Indicator bar */}
            <div
              className="absolute bottom-0 h-[2px] bg-emerald-500 shadow-[0_0_8px_#10b981] transition-all duration-300 w-1/3"
              style={{
                left: activeRightTab === "edit" ? "0%" : activeRightTab === "settings" ? "33.333%" : "66.666%"
              }}
            />
          </div>

          {/* Tab Body contents */}
          <div className="flex-1 overflow-y-auto scrollbar-hide p-6 space-y-8 pb-20">

            {/* TAB: Settings */}
            {activeRightTab === "settings" && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm text-stone-500 uppercase tracking-wider font-semibold block">
                    Custom Skin Theme
                  </label>
                  <div className={isReadOnly ? "pointer-events-none opacity-50" : ""}>
                    <ThemePicker
                      currentTheme={themeSkin}
                      onChange={(t) => setThemeSkin(t)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-stone-500 uppercase tracking-wider font-semibold block">
                    Slug Link URL
                  </label>
                  <input
                    type="text"
                    disabled={isReadOnly}
                    value={formSlug}
                    onChange={(e) => setFormSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
                    className="w-full bg-stone-950 border border-stone-800 rounded px-3 py-2 text-md text-stone-300 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-stone-500 uppercase tracking-wider font-semibold block">
                    Response Limits Cap
                  </label>
                  <input
                    type="number"
                    disabled={isReadOnly}
                    placeholder="Unlimited"
                    value={responseLimit ?? ""}
                    onChange={(e) => setResponseLimit(e.target.value ? Number(e.target.value) : null)}
                    className="w-full bg-stone-950 border border-stone-800 rounded px-3 py-2 text-md text-stone-300 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-stone-500 uppercase tracking-wider font-semibold block">
                    Expiry Date Picker
                  </label>
                  <input
                    type="date"
                    disabled={isReadOnly}
                    value={expiresAt ?? ""}
                    onChange={(e) => setExpiresAt(e.target.value || null)}
                    className="w-full bg-stone-950 border border-stone-800 rounded px-3 py-2 text-md text-stone-300 focus:outline-none focus:border-emerald-500 transition-colors font-mono"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-stone-500 uppercase tracking-wider font-semibold block">
                    Passphrase Protection
                  </label>
                  <input
                    type="password"
                    disabled={isReadOnly}
                    placeholder="Enter key to protect..."
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-800 rounded px-3 py-2 text-md text-stone-300 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-stone-500 uppercase tracking-wider font-semibold block">
                    Custom Thank-You Screen
                  </label>
                  <textarea
                    disabled={isReadOnly}
                    placeholder="Thank you for establishing your projection."
                    value={thankYouMessage}
                    onChange={(e) => setThankYouMessage(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-800 rounded px-3 py-2 text-md text-stone-300 focus:outline-none focus:border-emerald-500 transition-colors min-h-24 resize-y"
                  />
                </div>
              </div>
            )}

            {/* TAB: Edit Field Config */}
            {activeRightTab === "edit" && (
              <div className="space-y-6">
                
                {isSandboxMode && sandboxSubmission && (
                  <div className="mb-6 bg-emerald-950/20 border border-emerald-500/30 rounded p-4 animate-in fade-in zoom-in duration-300">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-emerald-400 mb-2 flex items-center gap-2">
                      <Sparkles size={14} /> Sandbox Result
                    </h4>
                    <pre className="text-[10px] leading-relaxed text-emerald-400/90 font-mono overflow-auto max-h-64 scrollbar-thin scrollbar-thumb-emerald-900 scrollbar-track-transparent">
                      {JSON.stringify(sandboxSubmission, null, 2)}
                    </pre>
                    <button 
                      onClick={() => setSandboxSubmission(null)}
                      className="mt-3 text-[10px] uppercase font-bold tracking-wider text-emerald-500/60 hover:text-emerald-400"
                    >
                      Clear result
                    </button>
                  </div>
                )}

                {!selectedField ? (
                  <div className="flex flex-col gap-4 py-8 px-4 items-center text-center">
                    <div className="w-12 h-12 rounded-sm bg-[rgba(201,147,58,0.06)] border border-[rgba(201,147,58,0.15)] flex items-center justify-center">
                      <MousePointer size={18} className="text-[#C9933A]/60" />
                    </div>
                    <p className="text-[16px] text-[rgba(200,216,232,0.4)]">
                      Click any question on the left to edit its label, type and settings here.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <label className="text-xs text-stone-500 uppercase tracking-wider font-semibold block">
                        Field Label Text
                      </label>
                      <input
                        type="text"
                        disabled={isReadOnly}
                        value={selectedField.label}
                        onChange={(e) => handleFieldChange("label", e.target.value)}
                        className="w-full bg-stone-950 border border-stone-800 rounded px-3 py-2 text-sm text-stone-300 focus:outline-none focus:border-emerald-500 transition-colors"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs text-stone-500 uppercase tracking-wider font-semibold block">
                        Input Placeholder Text
                      </label>
                      <input
                        type="text"
                        disabled={isReadOnly}
                        value={selectedField.placeholder ?? ""}
                        onChange={(e) => handleFieldChange("placeholder", e.target.value || null)}
                        className="w-full bg-stone-950 border border-stone-800 rounded px-3 py-2 text-sm text-stone-300 focus:outline-none focus:border-emerald-500 transition-colors"
                      />
                    </div>



                    <div className="flex items-center justify-between py-2 border-y border-stone-800/50 mt-4">
                      <span className="text-xs text-stone-400 uppercase tracking-wider font-semibold">
                        Field Required Toggle
                      </span>
                      <input
                        type="checkbox"
                        disabled={isReadOnly}
                        checked={selectedField.required}
                        onChange={(e) => handleFieldChange("required", e.target.checked)}
                        className="w-5 h-5 rounded accent-emerald-500 bg-stone-900 border-stone-700 cursor-pointer"
                      />
                    </div>

                    {/* Conditional Logic Editor */}
                    <div className="space-y-4 pt-4 border-t border-stone-800">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400">
                        Conditional Logic
                      </h4>

                      {(!selectedField.conditionalLogic?.rules || selectedField.conditionalLogic.rules.length === 0) ? (
                        <button
                          type="button"
                          disabled={isReadOnly}
                          onClick={() => {
                            const eligibleTargetFields = fields.filter((f) => f.id !== selectedField.id && f.type !== "layer_break");
                            if (eligibleTargetFields.length === 0) {
                              toast.error("Add other fields to configure dependencies.");
                              return;
                            }
                            handleFieldChange("conditionalLogic", {
                              rules: [
                                {
                                  fieldId: eligibleTargetFields[0].id,
                                  operator: "equals",
                                  value: "",
                                  action: "show",
                                },
                              ],
                            });
                          }}
                          className="w-full py-2 bg-stone-900 hover:bg-stone-800 text-stone-300 rounded border border-stone-800 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                        >
                          + Add Visibility Rule
                        </button>
                      ) : (
                        <div className="space-y-3">
                          {selectedField.conditionalLogic.rules.map((rule: any, ruleIdx: number) => {
                            const eligibleTargetFields = fields.filter((f) => f.id !== selectedField.id && f.type !== "layer_break");
                            return (
                              <div key={ruleIdx} className="bg-stone-950/40 p-3 rounded border border-stone-850 space-y-3 relative">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] text-stone-500 uppercase tracking-widest font-bold">Rule #{ruleIdx + 1}</span>
                                  {!isReadOnly && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const updatedRules = [...selectedField.conditionalLogic.rules];
                                        updatedRules.splice(ruleIdx, 1);
                                        handleFieldChange("conditionalLogic", updatedRules.length > 0 ? { rules: updatedRules } : null);
                                      }}
                                      className="text-[10px] text-red-400 hover:text-red-300 uppercase tracking-wider cursor-pointer"
                                    >
                                      Remove
                                    </button>
                                  )}
                                </div>

                                <div className="space-y-2">
                                  <label className="text-[9px] text-stone-500 uppercase block">Action</label>
                                  <select
                                    disabled={isReadOnly}
                                    value={rule.action}
                                    onChange={(e) => {
                                      const updatedRules = [...selectedField.conditionalLogic.rules];
                                      updatedRules[ruleIdx] = { ...rule, action: e.target.value };
                                      handleFieldChange("conditionalLogic", { rules: updatedRules });
                                    }}
                                    className="w-full bg-stone-950 border border-stone-800 rounded px-2.5 py-1.5 text-xs text-stone-300 focus:outline-none"
                                  >
                                    <option value="show">SHOW THIS FIELD</option>
                                    <option value="hide">HIDE THIS FIELD</option>
                                  </select>
                                </div>

                                <div className="space-y-2">
                                  <label className="text-[9px] text-stone-500 uppercase block">If Field</label>
                                  <select
                                    disabled={isReadOnly}
                                    value={rule.fieldId}
                                    onChange={(e) => {
                                      const updatedRules = [...selectedField.conditionalLogic.rules];
                                      updatedRules[ruleIdx] = { ...rule, fieldId: e.target.value };
                                      handleFieldChange("conditionalLogic", { rules: updatedRules });
                                    }}
                                    className="w-full bg-stone-950 border border-stone-800 rounded px-2.5 py-1.5 text-xs text-stone-300 focus:outline-none"
                                  >
                                    {eligibleTargetFields.map((f: any) => (
                                      <option key={f.id} value={f.id}>
                                        {f.label} ({f.type.replace("_", " ")})
                                      </option>
                                    ))}
                                  </select>
                                </div>

                                <div className="space-y-2">
                                  <label className="text-[9px] text-stone-500 uppercase block">Condition</label>
                                  <div className="flex gap-2">
                                    <select
                                      disabled={isReadOnly}
                                      value={rule.operator}
                                      onChange={(e) => {
                                        const updatedRules = [...selectedField.conditionalLogic.rules];
                                        updatedRules[ruleIdx] = { ...rule, operator: e.target.value };
                                        handleFieldChange("conditionalLogic", { rules: updatedRules });
                                      }}
                                      className="bg-stone-950 border border-stone-800 rounded px-2.5 py-1.5 text-xs text-stone-300 focus:outline-none"
                                    >
                                      <option value="equals">EQUALS</option>
                                      <option value="not_equals">NOT EQUALS</option>
                                    </select>

                                    <input
                                      type="text"
                                      disabled={isReadOnly}
                                      placeholder="Value..."
                                      value={rule.value}
                                      onChange={(e) => {
                                        const updatedRules = [...selectedField.conditionalLogic.rules];
                                        updatedRules[ruleIdx] = { ...rule, value: e.target.value };
                                        handleFieldChange("conditionalLogic", { rules: updatedRules });
                                      }}
                                      className="flex-1 bg-stone-950 border border-stone-800 rounded px-2.5 py-1.5 text-xs text-stone-300 focus:outline-none focus:border-emerald-500"
                                    />
                                  </div>
                                </div>
                              </div>
                            );
                          })}

                          {!isReadOnly && (
                            <button
                              type="button"
                              onClick={() => {
                                const eligibleTargetFields = fields.filter((f) => f.id !== selectedField.id && f.type !== "layer_break");
                                const updatedRules = [...selectedField.conditionalLogic.rules, {
                                  fieldId: eligibleTargetFields[0].id,
                                  operator: "equals",
                                  value: "",
                                  action: "show",
                                }];
                                handleFieldChange("conditionalLogic", { rules: updatedRules });
                              }}
                              className="w-full py-1.5 bg-stone-900/60 hover:bg-stone-900 text-stone-400 rounded border border-stone-850 border-dashed text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
                            >
                              + Add Another Rule
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Single/Multi Select Options Editor */}
                    {["single_select", "multi_select", "checkbox"].includes(selectedField.type) && (
                      <div className="space-y-2 pt-2">
                        <label className="text-xs text-stone-500 uppercase tracking-wider font-semibold block">
                          Options (Comma-separated)
                        </label>
                        <textarea
                          disabled={isReadOnly}
                          value={((selectedField.options as string[]) ?? []).join(", ")}
                          onChange={(e) =>
                            handleFieldChange(
                              "options",
                              e.target.value.split(",").map((s) => s.trim()).filter(Boolean)
                            )
                          }
                          className="w-full bg-stone-950 border border-stone-800 rounded px-3 py-2 text-md text-stone-300 focus:outline-none focus:border-emerald-500 transition-colors min-h-32"
                        />
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* TAB: Collaborators Panel & Premium Gate */}
            {activeRightTab === "collab" && (
              <div className="relative min-h-[400px]">

                {/* Paywall Gate for Free Plan */}
                {user?.subscriptionTier === "free" && (
                  <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-md rounded border border-stone-800 flex flex-col items-center justify-center p-6 text-center space-y-5 z-30 select-none animate-[fadeIn_0.5s_ease-out]">
                    <div className="w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500/40 flex items-center justify-center text-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                      <Lock size={20} />
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-md font-bold uppercase tracking-widest text-stone-200">
                        Pro Subscription Gate
                      </h4>
                      <p className="text-md text-stone-400 uppercase tracking-wider leading-relaxed px-4">
                        Team collaborators is a pro level construct. Unlock the ability to invite Forgers and Shades.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        if (confirm("Proceed to upgrade to premium Pro plan for team features?")) {
                          upgradeTierMutation.mutate({ tier: "pro" });
                        }
                      }}
                      disabled={upgradeTierMutation.isPending}
                      className="flex items-center space-x-2 px-5 py-3 bg-amber-950/40 hover:bg-amber-900/60 text-amber-400 border border-amber-900/60 hover:border-amber-500 rounded text-sm font-bold tracking-widest uppercase transition-all duration-300 shadow-[0_0_15px_rgba(245,158,11,0.1)] cursor-pointer mt-4"
                    >
                      <Sparkles size={14} />
                      <span>{upgradeTierMutation.isPending ? "Upgrading..." : "Unlock Pro"}</span>
                    </button>
                  </div>
                )}

                {/* Active Collaborators Panel (Locked/Unlocked) */}
                <div className="space-y-8">
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold tracking-widest uppercase text-stone-300">
                      Invite Collaborator
                    </h4>

                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (!collabEmail) return;
                        inviteCollaboratorMutation.mutate({
                          formId: id,
                          email: collabEmail,
                          role: collabRole,
                        });
                      }}
                      className="space-y-4 bg-stone-950/40 p-4 rounded-lg border border-stone-850"
                    >
                      <div className="space-y-2">
                        <label className="text-sm text-stone-500 uppercase tracking-wider font-semibold block">
                          Email Address
                        </label>
                        <input
                          type="email"
                          required
                          placeholder="forger@somnia.io"
                          value={collabEmail}
                          onChange={(e) => setCollabEmail(e.target.value)}
                          className="w-full bg-stone-950 border border-stone-800 rounded px-3 py-2 text-md text-stone-300 focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm text-stone-500 uppercase tracking-wider font-semibold block">
                          Role Assign
                        </label>
                        <select
                          value={collabRole}
                          onChange={(e) => setCollabRole(e.target.value as any)}
                          className="w-full bg-stone-950 border border-stone-800 rounded px-3 py-2 text-md text-stone-300 focus:outline-none focus:border-emerald-500"
                        >
                          <option value="THE_FORGER">THE_FORGER (Edit only)</option>
                          <option
                            value="THE_SHADE"
                            disabled={user?.subscriptionTier === "pro" || user?.subscriptionTier === "free"}
                          >
                            THE_SHADE (Observer) {user?.subscriptionTier === "pro" ? "🔒 Syndicate Only" : ""}
                          </option>
                        </select>
                        {user?.subscriptionTier === "pro" && collabRole === "THE_SHADE" && (
                          <p className="text-sm text-amber-500 mt-2 uppercase font-medium">
                            Observer mode requires the Syndicate tier.
                          </p>
                        )}
                      </div>

                      <button
                        type="submit"
                        disabled={inviteCollaboratorMutation.isPending}
                        className="w-full py-3 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded text-sm uppercase font-bold tracking-widest transition-colors cursor-pointer mt-2"
                      >
                        Send Invite
                      </button>
                    </form>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-stone-850">
                    <h4 className="text-sm font-bold tracking-widest uppercase text-stone-300">
                      Team Collaborators ({collaborators?.length ?? 0})
                    </h4>

                    <div className="space-y-3">
                      {isCollabLoading ? (
                        <div className="h-16 bg-stone-950/20 border border-stone-900 rounded animate-pulse" />
                      ) : collaborators && collaborators.length > 0 ? (
                        collaborators.map((c: any) => (
                          <div
                            key={c.userId}
                            className="flex items-center justify-between p-3 bg-stone-950/40 border border-stone-850 rounded-lg"
                          >
                            <div className="overflow-hidden mr-3">
                              <p className="font-semibold text-stone-200 text-sm truncate">{c.fullName}</p>
                              <p className="text-md text-stone-500 truncate mt-0.5">{c.email}</p>
                              <p className="text-[15px] text-emerald-500 uppercase font-bold tracking-widest mt-1.5">
                                {c.role.replace("THE_", "")}
                              </p>
                            </div>

                            {/* Remove Collaborator button */}
                            {isArchitect && (
                              <button
                                onClick={() => {
                                  if (confirm("Revoke this user's entry keys into this dreamscape level?")) {
                                    removeCollaboratorMutation.mutate({
                                      formId: id,
                                      collaboratorId: c.userId,
                                    });
                                  }
                                }}
                                className="p-2 text-stone-500 hover:text-red-400 rounded hover:bg-stone-900 transition-colors cursor-pointer shrink-0"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 border border-dashed border-stone-800 rounded text-stone-500 text-sm uppercase tracking-widest">
                          Solo Dream state (no team)
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Embedded Sandbox Viewer */}
            {isSandboxMode && sandboxSubmission && (
              <div className="mt-8 pt-6 border-t border-stone-800">
                <h4 className="text-xs font-bold uppercase tracking-widest text-emerald-400 mb-3 flex items-center gap-2">
                  <Sparkles size={14} />
                  Sandbox Payload
                </h4>
                <pre className="p-4 bg-emerald-950/10 border border-emerald-900/30 rounded text-[11px] font-mono text-emerald-400/80 overflow-x-auto">
                  {JSON.stringify(sandboxSubmission, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}