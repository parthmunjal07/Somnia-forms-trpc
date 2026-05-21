"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "~/lib/store";
import { trpc } from "~/trpc/client";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, loading, setUser, clearUser, setLoading } = useAuthStore();
  const meMutation = trpc.auth.me.useMutation();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const result = await meMutation.mutateAsync();
        if (result?.user) {
          setUser(result.user);
        } else {
          clearUser();
        }
      } catch (err) {
        clearUser();
      } finally {
        setLoading(false);
      }
    };

    if (!isAuthenticated) {
      checkAuth();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, setUser, clearUser, setLoading]);

  useEffect(() => {
    if (!loading && !isAuthenticated && !pathname.startsWith("/login") && !pathname.startsWith("/s/")) {
      router.push("/login");
    }
  }, [loading, isAuthenticated, pathname, router]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black font-mono select-none">
        {/* Inception spinning top animation (glowing, glassmorphic spinner) */}
        <div className="relative w-24 h-24 flex items-center justify-center animate-[spin_4s_linear_infinite]">
          <div className="absolute inset-0 border-t-2 border-r-2 border-emerald-500 rounded-full blur-[2px]" />
          <div className="absolute inset-2 border-b-2 border-l-2 border-amber-500 rounded-full blur-[1px]" />
          <div className="w-4 h-4 bg-white rounded-full shadow-[0_0_15px_#fff]" />
        </div>
        <div className="mt-8 text-xs text-stone-500 tracking-[0.25em] uppercase animate-pulse">
          Synchronizing Dream State...
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
