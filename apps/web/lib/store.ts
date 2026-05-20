import { create } from "zustand";

// Mirror the DB role enum without importing @repo/database into the client bundle
export type Role =
  | "THE_DREAMER"
  | "THE_EXTRACTOR"
  | "THE_ARCHITECT"
  | "THE_FORGER"
  | "THE_SHADE";

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
  emailVerifiedAt: string | null;
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  setUser: (user: AuthUser) => void;
  clearUser: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  loading: true,
  setUser: (user) => set({ user, isAuthenticated: true, loading: false }),
  clearUser: () => set({ user: null, isAuthenticated: false, loading: false }),
  setLoading: (loading) => set({ loading }),
}));
