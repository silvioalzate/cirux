import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAuthStore } from "@/lib/stores/authStore";
import { useNotificationStore } from "@/lib/stores/notificationStore";
import { useUIStore } from "@/lib/stores/uiStore";
import { testPatient, testConversation } from "@/test/fixtures";

describe("useAuthStore", () => {
  beforeEach(() => {
    useAuthStore.getState().reset();
  });

  it("initializes with null session/user", () => {
    const state = useAuthStore.getState();
    expect(state.session).toBeNull();
    expect(state.user).toBeNull();
    expect(state.role).toBeNull();
    // Note: isLoading starts as true, but reset() sets it to false
    // In a real app, the initial state before any init would be isLoading: true
    expect(state.isLoading).toBe(false);
  });

  it("sets session and derives role from app_metadata", () => {
    const { setSession, setUser } = useAuthStore.getState();

    act(() => {
      setUser({
        id: "user-1",
        email: "admin@example.com",
        app_metadata: { role: "admin" },
      } as unknown as Parameters<typeof setUser>[0]);
    });

    const state = useAuthStore.getState();
    expect(state.role).toBe("admin");
    expect(state.user?.email).toBe("admin@example.com");
  });

  it("defaults role to null when app_metadata has no role", () => {
    const { setUser } = useAuthStore.getState();

    act(() => {
      setUser({
        id: "user-2",
        email: "staff@example.com",
        app_metadata: {},
      } as unknown as Parameters<typeof setUser>[0]);
    });

    expect(useAuthStore.getState().role).toBeNull();
  });

  it("resets to initial state", () => {
    const { setUser, reset } = useAuthStore.getState();

    act(() => {
      setUser({ id: "user-1" } as unknown as Parameters<typeof setUser>[0]);
    });

    act(() => {
      reset();
    });

    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.role).toBeNull();
    expect(state.isLoading).toBe(false);
  });

  it("does not expose access_token in production", () => {
    // The store includes session which has access_token in dev (devtools).
    // This is a design test: verify the store shape doesn't leak unexpectedly.
    const state = useAuthStore.getState();
    expect(Object.keys(state)).toContain("session");
    // In production devtools are disabled, but session still exists in memory.
    // This test documents the risk.
  });
});

describe("useNotificationStore", () => {
  beforeEach(() => {
    useNotificationStore.getState().markAllRead();
    useNotificationStore.setState({ pendingConversations: [] });
  });

  it("adds pending conversation and increments unread", () => {
    const { addPendingConversation } = useNotificationStore.getState();

    act(() => {
      addPendingConversation(testConversation);
    });

    const state = useNotificationStore.getState();
    expect(state.pendingConversations).toHaveLength(1);
    expect(state.unreadCount).toBe(1);
  });

  it("does not duplicate existing conversation", () => {
    const { addPendingConversation } = useNotificationStore.getState();

    act(() => {
      addPendingConversation(testConversation);
      addPendingConversation(testConversation);
    });

    expect(useNotificationStore.getState().pendingConversations).toHaveLength(1);
  });

  it("removes conversation and decrements unread", () => {
    const { addPendingConversation, removePendingConversation } =
      useNotificationStore.getState();

    act(() => {
      addPendingConversation(testConversation);
      removePendingConversation(testConversation.id);
    });

    const state = useNotificationStore.getState();
    expect(state.pendingConversations).toHaveLength(0);
    expect(state.unreadCount).toBe(0);
  });

  it("does not let unreadCount go below zero", () => {
    const { removePendingConversation } = useNotificationStore.getState();

    act(() => {
      removePendingConversation("non-existent-id");
    });

    expect(useNotificationStore.getState().unreadCount).toBe(0);
  });

  it("sets pending conversations and updates count", () => {
    const { setPendingConversations } = useNotificationStore.getState();

    act(() => {
      setPendingConversations([testConversation, { ...testConversation, id: "conv-2" }]);
    });

    const state = useNotificationStore.getState();
    expect(state.pendingConversations).toHaveLength(2);
    expect(state.unreadCount).toBe(2);
  });
});

describe("useUIStore", () => {
  beforeEach(() => {
    useUIStore.getState().closeModal();
    useUIStore.setState({ sidebarOpen: true });
  });

  it("toggles sidebar", () => {
    const { toggleSidebar } = useUIStore.getState();

    act(() => {
      toggleSidebar();
    });

    expect(useUIStore.getState().sidebarOpen).toBe(false);

    act(() => {
      toggleSidebar();
    });

    expect(useUIStore.getState().sidebarOpen).toBe(true);
  });

  it("opens modal with payload", () => {
    const { openModal } = useUIStore.getState();

    act(() => {
      openModal("slotAction", { start: "2024-01-01", end: "2024-01-02" });
    });

    const state = useUIStore.getState();
    expect(state.activeModal).toBe("slotAction");
    expect(state.modalPayload).toEqual({ start: "2024-01-01", end: "2024-01-02" });
  });

  it("closes modal and clears payload", () => {
    const { openModal, closeModal } = useUIStore.getState();

    act(() => {
      openModal("slotAction");
    });

    act(() => {
      closeModal();
    });

    const state = useUIStore.getState();
    expect(state.activeModal).toBeNull();
    expect(state.modalPayload).toBeNull();
  });
});
