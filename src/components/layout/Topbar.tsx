"use client";

import { Bell, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useUIStore } from "@/lib/stores/uiStore";
import { useNotificationStore } from "@/lib/stores/notificationStore";
import { useAuthStore } from "@/lib/stores/authStore";
import { UserProfileModal } from "@/components/layout/UserProfileModal";
import { useMemo } from "react";

interface TopbarProps {
  title: string;
}

/**
 * Topbar del dashboard con título de sección, botón de sidebar móvil y badge de notificaciones.
 */
export function Topbar({ title }: TopbarProps) {
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const openModal = useUIStore((s) => s.openModal);
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const user = useAuthStore((s) => s.user);

  const initials = useMemo(() => user?.email?.slice(0, 2).toUpperCase() ?? "??", [user?.email]);

  return (
    <header className="h-16 border-b border-border bg-background/80 backdrop-blur-sm flex items-center px-6 gap-4 sticky top-0 z-20">
      {/* Mobile menu toggle */}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleSidebar}
        className="md:hidden"
        aria-label="Abrir menú"
      >
        <Menu className="size-4" />
      </Button>

      <h1 className="font-heading font-semibold text-lg text-foreground truncate flex-1">
        {title}
      </h1>

      <div className="flex items-center gap-3">
        {/* Notificaciones */}
        <div className="relative">
          <Button variant="ghost" size="icon" aria-label="Notificaciones">
            <Bell className="size-4" />
          </Button>
          {unreadCount > 0 && (
            <Badge
              variant="secondary"
              className="absolute -top-1 -right-1 h-4 min-w-4 text-[9px] px-1 flex items-center justify-center"
            >
              {unreadCount}
            </Badge>
          )}
        </div>

        {/* Avatar */}
        <button
          onClick={() => openModal("editProfile")}
          className="size-8 rounded-full bg-primary flex items-center justify-center text-[11px] font-bold text-[#0D141D] hover:bg-primary/80 transition-colors cursor-pointer"
          aria-label="Editar perfil"
        >
          {initials}
        </button>
      </div>

      <UserProfileModal />
    </header>
  );
}
