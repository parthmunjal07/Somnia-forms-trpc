"use client";

import React from "react";
import Link from "next/link";
import { trpc } from "~/trpc/client";
import { ArrowRight, Compass, Sparkles, Layers } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function ExplorePage() {
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = 
    trpc.forms.listPublic.useInfiniteQuery(
      { limit: 12 },
      { getNextPageParam: (lastPage) => lastPage.nextCursor }
    );

  const forms = data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <div className="min-h-[100dvh] bg-[#0A0A0F] text-[#EEF3F8] font-mono selection:bg-[#C9933A]/20 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(201,147,58,0.08),transparent_50%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(200,216,232,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(200,216,232,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />

      {/* Header */}
      <header className="border-b border-[rgba(200,216,232,0.1)] bg-[#0A0A0F]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded bg-[#15151A] border border-[rgba(201,147,58,0.3)] flex items-center justify-center group-hover:border-[#C9933A] transition-colors">
              <Compass size={16} className="text-[#C9933A]" />
            </div>
            <span className="font-cormorant text-xl tracking-[0.15em] text-[#C9933A]">SOMNIA</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="text-[12px] tracking-[0.15em] uppercase text-[#8BA3BF] hover:text-[#EEF3F8] transition-colors"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-16 relative z-10">
        <div className="mb-16">
          <h1 className="text-4xl md:text-5xl font-light font-cormorant tracking-wide text-[#EEF3F8] mb-4">
            The Public Directory
          </h1>
          <p className="text-sm tracking-[0.15em] text-[#8BA3BF] max-w-2xl leading-relaxed uppercase">
            Browse stabilized projections created by the community. Only structures explicitly marked for public access appear in this realm.
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="h-48 rounded bg-[#15151A] border border-[rgba(200,216,232,0.05)] animate-pulse" />
            ))}
          </div>
        ) : forms.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {forms.map((form) => (
                <Link
                  key={form.id}
                  href={`/f/${form.slug}`}
                  className="group block relative bg-[#15151A] border border-[rgba(200,216,232,0.1)] hover:border-[#C9933A]/50 rounded-lg p-6 transition-all duration-300 hover:shadow-[0_0_30px_rgba(201,147,58,0.1)] hover:-translate-y-1"
                >
                  <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ArrowRight size={16} className="text-[#C9933A]" />
                  </div>
                  
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-2 rounded bg-stone-900 border border-stone-800 text-stone-400 group-hover:text-[#C9933A] group-hover:border-[#C9933A]/30 transition-colors">
                      <Layers size={18} />
                    </div>
                  </div>

                  <h3 className="text-xl font-light font-cormorant text-stone-200 mb-2 truncate group-hover:text-[#EEF3F8] transition-colors">
                    {form.title}
                  </h3>
                  
                  <div className="flex flex-col space-y-2 mt-6">
                    <div className="flex items-center space-x-2 text-[10px] tracking-widest uppercase font-semibold text-stone-500">
                      <Sparkles size={12} />
                      <span>Theme: {form.theme.replace("_", " ")}</span>
                    </div>
                    <div className="text-[10px] tracking-widest uppercase font-semibold text-stone-600">
                      Formed {form.createdAt ? formatDistanceToNow(new Date(form.createdAt), { addSuffix: true }) : "Unknown"}
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {hasNextPage && (
              <div className="mt-16 text-center">
                <button
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  className="px-8 py-3 bg-transparent border border-[#C9933A]/30 hover:border-[#C9933A] text-[#C9933A] text-[11px] font-bold tracking-[0.2em] uppercase rounded transition-all hover:bg-[#C9933A]/5 disabled:opacity-50"
                >
                  {isFetchingNextPage ? "Extracting..." : "Descend Deeper"}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="py-24 text-center border border-dashed border-[rgba(200,216,232,0.1)] rounded-lg bg-[#15151A]/50">
            <Compass size={48} className="mx-auto text-stone-700 mb-6" />
            <h3 className="text-xl font-cormorant text-stone-400 mb-2">The directory is empty</h3>
            <p className="text-[11px] uppercase tracking-[0.15em] text-stone-600">
              No public projections have been stabilized yet.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
