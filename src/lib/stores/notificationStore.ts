import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { Conversation, StaffNotification } from "@/lib/types";

interface NotificationState {
  pendingConversations: Conversation[];
  systemNotifications: StaffNotification[];
  unreadCount: number;
  setPendingConversations: (conversations: Conversation[]) => void;
  addPendingConversation: (conversation: Conversation) => void;
  removePendingConversation: (id: string) => void;
  setSystemNotifications: (notifications: StaffNotification[]) => void;
  markAllRead: () => void;
}

/**
 * Store de notificaciones. Gestiona en tiempo real las conversaciones
 * pendientes de atención humana (RF-08) y notificaciones del sistema.
 * Se actualiza vía Supabase Realtime.
 */
export const useNotificationStore = create<NotificationState>()(
  devtools(
    (set, get) => ({
      pendingConversations: [],
      systemNotifications: [],
      unreadCount: 0,

      setPendingConversations: (conversations) =>
        set(
          { pendingConversations: conversations, unreadCount: conversations.length },
          false,
          "notifications/setPendingConversations"
        ),

      addPendingConversation: (conversation) => {
        const exists = get().pendingConversations.some((c) => c.id === conversation.id);
        if (exists) return;
        set(
          (state) => ({
            pendingConversations: [conversation, ...state.pendingConversations],
            unreadCount: state.unreadCount + 1,
          }),
          false,
          "notifications/addPendingConversation"
        );
      },

      removePendingConversation: (id) =>
        set(
          (state) => ({
            pendingConversations: state.pendingConversations.filter((c) => c.id !== id),
            unreadCount: Math.max(0, state.unreadCount - 1),
          }),
          false,
          "notifications/removePendingConversation"
        ),

      setSystemNotifications: (notifications) =>
        set({ systemNotifications: notifications }, false, "notifications/setSystemNotifications"),

      markAllRead: () =>
        set({ unreadCount: 0 }, false, "notifications/markAllRead"),
    }),
    { name: "NotificationStore", enabled: process.env.NODE_ENV === "development" }
  )
);
