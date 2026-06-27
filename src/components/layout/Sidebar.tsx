"use client";

import { useMemo, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { useTheme } from "next-themes";
import {
  CalendarDays,
  Users,
  BellRing,
  Stethoscope,
  Settings,
  ClipboardList,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/lib/stores/uiStore";
import { useNotificationStore } from "@/lib/stores/notificationStore";
import { useAuthStore } from "@/lib/stores/authStore";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { label: "Calendario", href: "/dashboard/calendar", icon: CalendarDays },
  { label: "Pacientes", href: "/dashboard/patients", icon: Users },
  { label: "Citas", href: "/dashboard/appointments", icon: ClipboardList },
  { label: "Notificaciones", href: "/dashboard/notifications", icon: BellRing },
  { label: "Procedimientos", href: "/dashboard/procedures", icon: Stethoscope, adminOnly: true },
  { label: "Configuración", href: "/dashboard/settings", icon: Settings, adminOnly: true },
];

/**
 * Sidebar de navegación principal del dashboard.
 * Soporta colapso y muestra el badge de notificaciones pendientes.
 */
export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const role = useAuthStore((s) => s.role);
  const reset = useAuthStore((s) => s.reset);
  const supabase = useMemo(() => createClient(), []);
  const { resolvedTheme } = useTheme();

  const handleLogout = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Error al cerrar sesión");
      return;
    }
    reset();
    router.push("/login");
  }, [reset, router, supabase]);

  return (
    <aside
      className={cn(
        "flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300 z-30",
        "fixed inset-y-0 left-0 md:relative md:translate-x-0",
        sidebarOpen ? "w-60 translate-x-0" : "w-16 -translate-x-full md:translate-x-0"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-5 border-b border-sidebar-border">
        {sidebarOpen && (
          <Link href="/dashboard" className="flex items-center hover:opacity-80 transition-opacity">
            <Image
              src={resolvedTheme === "dark" ? "/logo-cirux-dark.webp" : "/logo-cirux-light.webp"}
              alt="Cirux"
              width={120}
              height={32}
              className="h-8 w-auto"
              priority
              suppressHydrationWarning
            />
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="text-sidebar-foreground hover:bg-sidebar-accent ml-auto"
          aria-label={sidebarOpen ? "Colapsar sidebar" : "Expandir sidebar"}
        >
          {sidebarOpen ? <X className="size-4" /> : <Menu className="size-4" />}
        </Button>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {navItems
          .filter((item) => !item.adminOnly || role === "admin")
          .map((item) => {
            const isActive = pathname.startsWith(item.href);
            const Icon = item.icon;
            const isNotif = item.href === "/dashboard/notifications";

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-[12px] px-3 py-2.5 text-sm font-medium transition-colors",
                  "text-sidebar-foreground hover:bg-sidebar-accent hover:text-primary",
                  isActive && "bg-primary/10 text-primary"
                )}
                title={!sidebarOpen ? item.label : undefined}
              >
                <div className="relative flex-shrink-0">
                  <Icon className="size-4" />
                  {isNotif && unreadCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 size-2 bg-secondary rounded-full" />
                  )}
                </div>
                {sidebarOpen && (
                  <span className="truncate">{item.label}</span>
                )}
                {sidebarOpen && isNotif && unreadCount > 0 && (
                  <Badge
                    variant="secondary"
                    className="ml-auto text-[10px] px-1.5 py-0 h-5"
                  >
                    {unreadCount}
                  </Badge>
                )}
              </Link>
            );
          })}
      </nav>

      {/* Logout */}
      <div className="px-2 py-3 border-t border-sidebar-border">
        <button
          onClick={handleLogout}
          className={cn(
            "flex items-center gap-3 rounded-[12px] px-3 py-2.5 text-sm font-medium w-full",
            "text-sidebar-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
          )}
          title={!sidebarOpen ? "Cerrar sesión" : undefined}
        >
          <LogOut className="size-4 flex-shrink-0" />
          {sidebarOpen && <span>Cerrar sesión</span>}
        </button>
      </div>
    </aside>
  );
}
