import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { Providers } from "@/components/providers";

interface DashboardLayoutProps {
  children: React.ReactNode;
  params?: Promise<{ segment?: string }>;
}

/**
 * Layout protegido del dashboard. Verifica sesión en el servidor
 * y renderiza el shell con Sidebar + Topbar.
 */
export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <Providers>
      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar />

        {/* Main content area */}
        <div className="flex flex-col flex-1 overflow-hidden">
          <Topbar title="Dashboard" />
          <main className="flex-1 overflow-y-auto p-8">
            {children}
          </main>
        </div>
      </div>
    </Providers>
  );
}
