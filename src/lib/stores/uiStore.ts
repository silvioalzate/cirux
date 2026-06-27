import { create } from "zustand";
import { devtools } from "zustand/middleware";

type ModalKey =
  | "slotAction"
  | "appointmentDetail"
  | "createPatient"
  | "sendNotification"
  | "editProfile"
  | null;

interface UIState {
  sidebarOpen: boolean;
  activeModal: ModalKey;
  modalPayload: Record<string, unknown> | null;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  openModal: (key: ModalKey, payload?: Record<string, unknown>) => void;
  closeModal: () => void;
}

/**
 * Store de UI global. Controla el sidebar y el stack de modales.
 */
export const useUIStore = create<UIState>()(
  devtools(
    (set) => ({
      sidebarOpen: true,
      activeModal: null,
      modalPayload: null,

      setSidebarOpen: (open) =>
        set({ sidebarOpen: open }, false, "ui/setSidebarOpen"),

      toggleSidebar: () =>
        set(
          (state) => ({ sidebarOpen: !state.sidebarOpen }),
          false,
          "ui/toggleSidebar"
        ),

      openModal: (key, payload = {}) =>
        set({ activeModal: key, modalPayload: payload }, false, "ui/openModal"),

      closeModal: () =>
        set({ activeModal: null, modalPayload: null }, false, "ui/closeModal"),
    }),
    { name: "UIStore", enabled: process.env.NODE_ENV === "development" }
  )
);
