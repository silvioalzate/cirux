"use client";

import { useEffect, useMemo } from "react";
import { createClient } from "@/utils/supabase/client";
import { useAuthStore } from "@/lib/stores/authStore";
import { useNotificationStore } from "@/lib/stores/notificationStore";
import type { Conversation } from "@/lib/types";

/**
 * Proveedor global React que:
 * 1. Sincroniza la sesión de Supabase Auth con authStore.
 * 2. Suscribe a Supabase Realtime en conversations.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  const { setUser, setSession, setLoading } = useAuthStore();
  const { setPendingConversations, addPendingConversation } = useNotificationStore();
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    // Sincronizar sesión inicial
    const init = async () => {
      setLoading(true);
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    };

    void init();

    // Listener para cambios de auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, [setSession, setUser, setLoading, supabase]);

  useEffect(() => {
    // Cargar conversaciones pendientes iniciales vía API route
    // Evita exponer nombres de tablas sensibles en el bundle del cliente
    const loadPending = async () => {
      try {
        const res = await fetch("/api/v1/notifications/pending");
        if (res.ok) {
          const { conversations } = await res.json();
          setPendingConversations(conversations as Conversation[]);
        }
      } catch (err) {
        console.error("Error loading pending conversations:", err);
      }
    };

    void loadPending();

    // Suscripción Realtime a conversaciones (INSERT y UPDATE)
    const channel = supabase
      .channel("conversations-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "conversations",
          filter: "status=eq.pending_human",
        },
        (payload) => {
          addPendingConversation(payload.new as Conversation);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "conversations",
          filter: "status=eq.pending_human",
        },
        (payload) => {
          addPendingConversation(payload.new as Conversation);
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [setPendingConversations, addPendingConversation, supabase]);

  return <>{children}</>;
}
