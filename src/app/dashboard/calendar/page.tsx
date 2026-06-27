"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { DateSelectArg, EventClickArg, EventInput } from "@fullcalendar/core";
import esLocale from "@fullcalendar/core/locales/es-us";
import { createClient } from "@/utils/supabase/client";
import { useUIStore } from "@/lib/stores/uiStore";
import { SlotActionModal } from "@/components/calendar/SlotActionModal";
import { Loader2 } from "lucide-react";
import type { Slot, WorkingHours, Appointment } from "@/lib/types";

const FullCalendar = dynamic(() => import("@fullcalendar/react"), { ssr: false });

const DAY_MAP: Record<string, number> = {
  sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6,
};

function parseWorkingHours(wh: WorkingHours | null) {
  const fallback = {
    mon: ["08:00", "18:00"] as [string, string],
    tue: ["08:00", "18:00"] as [string, string],
    wed: ["08:00", "18:00"] as [string, string],
    thu: ["08:00", "18:00"] as [string, string],
    fri: ["08:00", "18:00"] as [string, string],
    sat: ["08:00", "13:00"] as [string, string],
    sun: null,
  };

  const hours = wh && Object.keys(wh).length > 0 ? wh : fallback;

  const businessHours: { daysOfWeek: number[]; startTime: string; endTime: string }[] = [];
  let globalMin = "23:59";
  let globalMax = "00:00";

  for (const [day, range] of Object.entries(hours)) {
    if (!range) continue;
    const dayIndex = DAY_MAP[day];
    if (dayIndex === undefined) continue;

    const [start, end] = range;
    businessHours.push({ daysOfWeek: [dayIndex], startTime: start, endTime: end });

    if (start < globalMin) globalMin = start;
    if (end > globalMax) globalMax = end;
  }

  return {
    slotMinTime: `${globalMin}:00`,
    slotMaxTime: `${globalMax}:00`,
    businessHours,
  };
}

const calendarPlugins = [dayGridPlugin, timeGridPlugin, interactionPlugin];
const calendarHeader = {
  left: "prev,next today",
  center: "title",
  right: "dayGridMonth,timeGridWeek,timeGridDay",
};
const calendarButtons = {
  prev: "<",
  next: ">",
};

const STATUS_COLORS: Record<string, string> = {
  confirmed: "#10b981",
  reschedule: "#f59e0b",
  cancelled: "#ef4444",
  completed: "#6b7280",
};

const BLOCK_COLORS: Record<string, string> = {
  surgery: "#6366f1",
  admin: "#8b5cf6",
  vacation: "#ec4899",
  event: "#f97316",
};

/**
 * Vista de calendario interactivo con FullCalendar + Supabase Realtime.
 * Permite agendar citas y bloquear espacios (RF-09.1).
 * Usa working_hours desde agent_config.
 */
export default function CalendarPage() {
  const supabase = useMemo(() => createClient(), []);
  const [events, setEvents] = useState<EventInput[]>([]);
  const [workingHours, setWorkingHours] = useState<WorkingHours | null>(null);
  const [initialLoad, setInitialLoad] = useState(true);
  const openModal = useUIStore((s) => s.openModal);

  const { slotMinTime, slotMaxTime, businessHours } = useMemo(
    () => parseWorkingHours(workingHours),
    [workingHours]
  );

  useEffect(() => {
    const loadConfig = async () => {
      const { data } = await supabase
        .from("agent_config")
        .select("working_hours")
        .single();
      if (data?.working_hours) {
        setWorkingHours(data.working_hours as unknown as WorkingHours);
      }
    };
    void loadConfig();
  }, [supabase]);

  const loadEvents = useCallback(async () => {
    const now = new Date();
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
    const threeMonthsAhead = new Date(now.getFullYear(), now.getMonth() + 4, 0);

    const [{ data: blocks }, { data: apptSlots }] = await Promise.all([
      supabase
        .from("slots")
        .select("id, start_at, end_at, block_type")
        .neq("block_type", "appointment")
        .gte("start_at", threeMonthsAgo.toISOString())
        .lte("start_at", threeMonthsAhead.toISOString())
        .limit(500),
      supabase
        .from("slots")
        .select("id, start_at, end_at, status, channel, notes, patient:patients(name), procedure:procedures(name)")
        .eq("block_type", "appointment")
        .in("status", ["pending", "confirmed", "completed"])
        .order("created_at", { ascending: false })
        .limit(200),
    ]);

    const slotEvents: EventInput[] = (blocks ?? []).map((s) => ({
      id: `slot-${s.id}`,
      title: s.block_type ? `🔒 ${s.block_type}` : "Bloqueado",
      start: s.start_at,
      end: s.end_at,
      backgroundColor: BLOCK_COLORS[s.block_type] ?? "#8b5cf6",
      borderColor: "transparent",
      textColor: "#fff",
      extendedProps: { type: "slot", slotId: s.id },
    }));

    const apptEvents: EventInput[] = (apptSlots ?? []).map((a: Record<string, unknown>) => ({
      id: `appt-${a.id as string}`,
      title: `${(a.patient as Record<string, string>)?.name ?? "Paciente"} · ${(a.procedure as Record<string, string>)?.name ?? "Consulta"}`,
      start: a.start_at as string,
      end: a.end_at as string,
      backgroundColor: STATUS_COLORS[a.status as string] ?? "#6b7280",
      borderColor: "transparent",
      textColor: "#fff",
      extendedProps: { type: "appointment", appointment: a },
    }));

    setEvents([...slotEvents, ...apptEvents]);
    setInitialLoad(false);
  }, [supabase]);

  useEffect(() => {
    void loadEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel("calendar-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "slots", filter: "block_type=neq.null" }, () => {
        void loadEvents();
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [loadEvents, supabase]);

  const handleDateSelect = useCallback((selectInfo: DateSelectArg) => {
    openModal("slotAction", {
      start: selectInfo.startStr,
      end: selectInfo.endStr,
    });
  }, [openModal]);

  const handleEventClick = useCallback((clickInfo: EventClickArg) => {
    const { type, appointment } = clickInfo.event.extendedProps;
    if (type === "appointment") {
      openModal("appointmentDetail", { appointment });
    }
  }, [openModal]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading font-bold text-2xl text-foreground">Agenda Clínica</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Gestiona citas, bloqueos y disponibilidad en tiempo real
        </p>
      </div>

      <div className="bg-card rounded-[18px] border border-border p-4 shadow-sm overflow-hidden">
        {events.length === 0 && initialLoad ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="size-6 animate-spin" />
          </div>
        ) : (
          <FullCalendar
            plugins={calendarPlugins}
            initialView="timeGridWeek"
            locale={esLocale}
            headerToolbar={calendarHeader}
            buttonText={calendarButtons}
            events={events}
            selectable
            selectMirror
            select={handleDateSelect}
            eventClick={handleEventClick}
            height="calc(100vh - 280px)"
            slotMinTime={slotMinTime}
            slotMaxTime={slotMaxTime}
            slotDuration="01:00:00"
            slotLabelInterval="01:00"
            businessHours={businessHours}
            allDaySlot={false}
            nowIndicator
            eventDisplay="block"
            dayMaxEvents={3}
          />
        )}
      </div>

      <SlotActionModal onSuccess={loadEvents} />
    </div>
  );
}
