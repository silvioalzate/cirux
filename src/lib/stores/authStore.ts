import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { Session, User } from "@supabase/supabase-js";
import type { StaffRole } from "@/lib/types";

interface AuthState {
  session: Session | null;
  user: User | null;
  role: StaffRole | null;
  isLoading: boolean;
  setSession: (session: Session | null) => void;
  setUser: (user: User | null) => void;
  setRole: (role: StaffRole | null) => void;
  setLoading: (isLoading: boolean) => void;
  reset: () => void;
}

/**
 * Store de autenticación. Sincroniza sesión de Supabase y rol del usuario.
 * El rol se extrae de `app_metadata.role` en el JWT.
 */
export const useAuthStore = create<AuthState>()(
  devtools(
    (set) => ({
      session: null,
      user: null,
      role: null,
      isLoading: true,

      setSession: (session) =>
        set({ session }, false, "auth/setSession"),

      setUser: (user) => {
        const role =
          (user?.app_metadata?.role as StaffRole | undefined) ?? null;
        set({ user, role }, false, "auth/setUser");
      },

      setRole: (role) =>
        set({ role }, false, "auth/setRole"),

      setLoading: (isLoading) =>
        set({ isLoading }, false, "auth/setLoading"),

      reset: () =>
        set(
          { session: null, user: null, role: null, isLoading: false },
          false,
          "auth/reset"
        ),
    }),
    { name: "AuthStore", enabled: process.env.NODE_ENV === "development" }
  )
);
