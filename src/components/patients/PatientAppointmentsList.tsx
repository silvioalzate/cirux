"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { formatPgTime } from "@/lib/utils";
import AppointmentStatusBadge from "./AppointmentStatusBadge";
import type { Slot } from "@/lib/types";

interface Props {
  patientId: string;
}

export function PatientAppointmentsList({ patientId }: Props) {
  const supabase = useMemo(() => createClient(), []);
  const [appointments, setAppointments] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("slots")
      .select("*, procedure:procedures(name)")
      .eq("block_type", "appointment")
      .eq("patient_id", patientId)
      .order("start_at", { ascending: false })
      .limit(50);

    if (data) setAppointments(data as Slot[]);
    setLoading(false);
  }, [patientId, supabase]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <Card className="border-border">
        <CardContent className="pt-6">
          <p className="text-muted-foreground text-sm text-center py-8">
            Cargando citas…
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border">
      <CardContent className="pt-6">
        {appointments.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-8">
            No hay citas registradas.
          </p>
        ) : (
          <div className="space-y-3">
            {appointments.map((apt) => (
              <div
                key={apt.id}
                className="flex items-center justify-between p-3 rounded-[12px] bg-muted/30 border border-border/50"
              >
                <div>
                  <p className="text-sm font-medium">
                    {apt.procedure?.name ?? "Consulta general"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {apt.start_at ? formatPgTime(apt.start_at, "dd MMM yyyy · HH:mm") : "—"}
                  </p>
                </div>
                <AppointmentStatusBadge
                  slotId={apt.id}
                  status={apt.status}
                  onUpdated={load}
                />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
