"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPgTime } from "@/lib/utils";
import type { Slot } from "@/lib/types";

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  confirmed: { label: "Confirmada", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  cancelled: { label: "Cancelada", className: "bg-red-50 text-red-700 border-red-200" },
  completed: { label: "Completada", className: "bg-gray-50 text-gray-600 border-gray-200" },
  reschedule: { label: "Reprogramar", className: "bg-yellow-50 text-yellow-700 border-yellow-200" },
};

/**
 * Listado de todas las citas con actualización en tiempo real.
 */
export default function AppointmentsPage() {
  const supabase = useMemo(() => createClient(), []);
  const [appointments, setAppointments] = useState<Slot[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("slots")
        .select("*, patient:patients(name, phone), procedure:procedures(name)")
        .eq("block_type", "appointment")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) {
        console.error("Slots query error:", (error as Error).message);
      }
      if (data) {
        setAppointments(data as Slot[]);
      }
    } catch (err) {
      console.error("Slots fetch error:", (err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    void load();

    const channel = supabase
      .channel("appointments-list")
      .on("postgres_changes", { event: "*", schema: "public", table: "slots", filter: "block_type=eq.appointment" }, () => {
        void load();
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [load, supabase]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading font-bold text-2xl text-foreground">Citas</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Historial completo de citas del consultorio
        </p>
      </div>

      <Card className="border-border">
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-14 rounded-[12px]" />
              ))}
            </div>
          ) : appointments.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-muted-foreground text-sm">
              No hay citas registradas.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <caption className="sr-only">
                  Listado de citas del consultorio
                </caption>
                <thead>
                  <tr className="text-left text-muted-foreground text-xs uppercase tracking-wide border-b border-border">
                    <th scope="col" className="pb-3 pr-4 font-medium">Paciente</th>
                    <th scope="col" className="pb-3 pr-4 font-medium">Procedimiento</th>
                    <th scope="col" className="pb-3 pr-4 font-medium">Canal</th>
                    <th scope="col" className="pb-3 pr-4 font-medium">Fecha y hora</th>
                    <th scope="col" className="pb-3 font-medium">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {appointments.map((apt) => {
                    const cfg = STATUS_CONFIG[apt.status] ?? STATUS_CONFIG.confirmed;
                    return (
                      <tr key={apt.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3 pr-4">
                          <p className="font-medium text-foreground">
                            {apt.patient?.name ?? "—"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {apt.patient?.phone ?? ""}
                          </p>
                        </td>
                        <td className="py-3 pr-4 text-foreground">
                          {apt.procedure?.name ?? "—"}
                        </td>
                        <td className="py-3 pr-4 text-muted-foreground capitalize">
                          {apt.channel}
                        </td>
                        <td className="py-3 pr-4 text-foreground">
                          {apt.start_at ? formatPgTime(apt.start_at, "dd MMM yyyy · HH:mm") : "—"}
                        </td>
                        <td className="py-3">
                          <Badge
                            variant="outline"
                            className={`text-[10px] ${cfg.className}`}
                          >
                            {cfg.label}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
