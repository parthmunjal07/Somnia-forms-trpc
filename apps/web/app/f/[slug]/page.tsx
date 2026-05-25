import React from "react";
import { Metadata } from "next";
import { api } from "~/trpc/server";
import { FormClientWrapper } from "~/components/FormClientWrapper";
import { AlertCircle } from "lucide-react";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const data = await api.forms.getBySlug.query({ slug });
    return {
      title: data.form?.title ? `${data.form.title} | Somnia Forms` : "Somnia Form",
      description: "Plant a totem seed and project variables into the subconscious database layers.",
    };
  } catch (e) {
    return {
      title: "Somnia Form",
    };
  }
}

export default async function PublicFormPage({ params }: PageProps) {
  const { slug } = await params;

  try {
    // Initial fetch from SSR Server Component
    const initialData = await api.forms.getBySlug.query({ slug });

    return (
      <FormClientWrapper
        slug={slug}
        initialData={initialData as any}
      />
    );
  } catch (err: any) {
    // Return themed "Dreamscape Unreachable" error screen if not found or server error
    return (
      <div className="min-h-screen bg-stone-950 flex flex-col items-center justify-center font-mono p-4 selection:bg-red-500/20">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1c1917_1px,transparent_1px),linear-gradient(to_bottom,#1c1917_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20 pointer-events-none" />

        <div className="max-w-md w-full bg-stone-900/30 border border-red-950/60 p-8 rounded-lg shadow-2xl text-center space-y-6 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-500">
          <div className="mx-auto w-12 h-12 rounded bg-red-950/10 border border-red-900/40 flex items-center justify-center text-red-500 animate-pulse">
            <AlertCircle size={20} />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-light text-stone-200 font-cormorant tracking-wider uppercase">
              Dreamscape Unreachable
            </h2>
            <p className="text-xs text-stone-500 uppercase tracking-widest leading-relaxed">
              {err?.message || "The requested subconscious path does not exist or has been collapsed by the architect."}
            </p>
          </div>
        </div>
      </div>
    );
  }
}
