"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  Loader2,
  Lock,
  CalendarPlus,
  Clock,
  CalendarDays,
  Trash2,
} from "lucide-react";
import { format } from "date-fns/format";
import { startOfDay } from "date-fns/startOfDay";
import { setHours } from "date-fns/setHours";
import { setMinutes } from "date-fns/setMinutes";
import { es } from "date-fns/locale/es";
import { DayPicker } from "react-day-picker";
import { createClient } from "@/utils/supabase/client";
import { toColombiaISOString } from "@/lib/utils";
import { useUIStore } from "@/lib/stores/uiStore";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Patient, Procedure } from "@/lib/types";

// ─── Schemas ────────────────────────────────────────────────────────────────

const blockSchema = z.object({
  dates: z.array(z.date()).min(1, "Selecciona al menos un día"),
  startTime: z.string().min(1, "Hora de inicio requerida"),
  endTime: z.string().min(1, "Hora de fin requerida"),
  blockType: z.enum(["surgery", "admin", "vacation", "event"]),
  notes: z.string().optional(),
}).refine((d) => {
  if (!d.startTime || !d.endTime) return true;
  return d.startTime < d.endTime;
}, {
  message: "La hora de fin debe ser posterior a la de inicio",
  path: ["endTime"],
});

const appointmentSchema = z.object({
  patientSearch: z.string(),
  patientId: z.string().min(1, "Selecciona un paciente"),
  procedureId: z.string().min(1, "Selecciona un procedimiento"),
  startTime: z.string().min(1, "Hora de inicio requerida"),
  endTime: z.string().min(1, "Hora de fin requerida"),
  channel: z.enum(["whatsapp", "messenger", "instagram", "tiktok", "web", "manual"]),
}).refine((d) => d.patientId.length > 0 && d.patientId !== "", {
  message: "Selecciona un paciente válido",
  path: ["patientId"],
}).refine((d) => {
  if (!d.startTime || !d.endTime) return true;
  return d.startTime < d.endTime;
}, {
  message: "La hora de fin debe ser posterior a la de inicio",
  path: ["endTime"],
});

type BlockValues = z.infer<typeof blockSchema>;
type AppointmentValues = z.infer<typeof appointmentSchema>;

// ─── Props ───────────────────────────────────────────────────────────────────

interface SlotActionModalProps {
  onSuccess?: () => void;
}

/**
 * Modal de acción sobre un slot del calendario.
 * Permite: bloquear espacio o agendar cita manual (RF-09.1.2 / RF-09.1.5).
 */
export function SlotActionModal({ onSuccess }: SlotActionModalProps) {
  const supabase = useMemo(() => createClient(), []);
  const activeModal = useUIStore((s) => s.activeModal);
  const modalPayload = useUIStore((s) => s.modalPayload);
  const closeModal = useUIStore((s) => s.closeModal);
  const isOpen = activeModal === "slotAction";

  const [patients, setPatients] = useState<Patient[]>([]);
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [searchValue, setSearchValue] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());
  const [showCalendar, setShowCalendar] = useState(false);

  // Extract initial date range from FullCalendar selection
  const initialDates = useMemo(() => {
    if (!modalPayload) return [];
    const { start, end } = modalPayload as { start: string; end: string };
    if (!start || !end) return [];

    const startDate = startOfDay(new Date(start));
    const endDate = startOfDay(new Date(end));
    // end is exclusive in FullCalendar; subtract 1 day for multi-day selections
    const adjustedEnd = new Date(endDate.getTime() - 86400000);

    if (adjustedEnd.getTime() <= startDate.getTime()) {
      return [startDate];
    }

    const dates: Date[] = [];
    let current = startDate;
    while (current <= adjustedEnd) {
      dates.push(new Date(current));
      current = new Date(current.getTime() + 86400000);
    }
    return dates;
  }, [modalPayload]);

  const initialStartTime = useMemo(() => {
    if (!modalPayload) return "08:00";
    const { start } = modalPayload as { start: string; end: string };
    if (!start) return "08:00";
    const time = format(new Date(start), "HH:mm");
    return time === "00:00" ? "08:00" : time;
  }, [modalPayload]);

  const initialEndTime = useMemo(() => {
    if (!modalPayload) return "09:00";
    const { end, start } = modalPayload as { start: string; end: string };
    if (!end) return "09:00";
    const endTime = format(new Date(end), "HH:mm");
    if (endTime === "00:00") {
      const st = start ? format(new Date(start), "HH:mm") : "08:00";
      if (st === "00:00") return "09:00";
      const [h, m] = st.split(":").map(Number);
      const totalMinutes = h * 60 + m + 60;
      const newH = Math.floor(totalMinutes / 60) % 24;
      const newM = totalMinutes % 60;
      return `${String(newH).padStart(2, "0")}:${String(newM).padStart(2, "0")}`;
    }
    return endTime;
  }, [modalPayload]);

  // Block form
  const blockForm = useForm<BlockValues>({
    resolver: zodResolver(blockSchema),
    defaultValues: {
      dates: initialDates,
      startTime: initialStartTime,
      endTime: initialEndTime,
      blockType: "admin",
      notes: "",
    },
  });

  const selectedDates = blockForm.watch("dates");
  const selectedStartTime = blockForm.watch("startTime");
  const selectedEndTime = blockForm.watch("endTime");

  // Load procedures on mount + reset form on open
  useEffect(() => {
    if (isOpen) {
      const load = async () => {
        const { data } = await supabase
          .from("procedures")
          .select("id, name, duration_min")
          .eq("is_active", true)
          .order("name");
        setProcedures((data ?? []) as Procedure[]);
      };
      void load();
      // Reset form state
      apptForm.reset({ patientSearch: "", patientId: "", procedureId: "", startTime: initialStartTime, endTime: initialEndTime, channel: "web" });
      blockForm.reset({
        dates: initialDates,
        startTime: initialStartTime,
        endTime: initialEndTime,
        blockType: "admin",
        notes: "",
      });
      setSearchValue("");
      setPatients([]);
      setShowCalendar(false);
      if (initialDates.length > 0) {
        setCalendarMonth(initialDates[0]);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Search patients with debounce
  const searchPatients = useCallback(
    async (query: string) => {
      const trimmed = query.trim();
      if (!trimmed) {
        setPatients([]);
        return;
      }
      setIsSearching(true);
      const escaped = trimmed.replace(/[%_]/g, "\\$&");
      const { data } = await supabase
        .from("patients")
        .select("id, name, phone")
        .or(`name.ilike.%${escaped}%,phone.ilike.%${escaped}%`)
        .limit(5);
      setPatients((data ?? []) as Patient[]);
      setIsSearching(false);
    },
    [supabase]
  );

  const removeDate = (dateToRemove: Date) => {
    const current = blockForm.getValues("dates");
    blockForm.setValue(
      "dates",
      current.filter((d) => d.toDateString() !== dateToRemove.toDateString()),
      { shouldValidate: true, shouldDirty: true }
    );
  };

  const onBlock = useCallback(async (values: BlockValues) => {
    const [startH, startM] = values.startTime.split(":").map(Number);
    const [endH, endM] = values.endTime.split(":").map(Number);

    const slots = values.dates.map((date) => {
      const dateStr = format(date, "yyyy-MM-dd");
      return {
        start_at: toColombiaISOString(dateStr, startH, startM),
        end_at: toColombiaISOString(dateStr, endH, endM),
        block_type: values.blockType,
        status: "blocked",
      };
    });

    const { error } = await supabase.from("slots").insert(slots);

    if (error) {
      toast.error("Error al bloquear los espacios.");
      return;
    }

    toast.success(
      `${slots.length} espacio(s) bloqueado(s): ${values.blockType}`
    );
    closeModal();
    onSuccess?.();
  }, [closeModal, onSuccess, supabase]);

  // Appointment form
  const apptForm = useForm<AppointmentValues>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: { patientSearch: "", patientId: "", procedureId: "", startTime: initialStartTime, endTime: initialEndTime, channel: "web" },
    mode: "onChange",
  });

  const onAppointment = useCallback(async (values: AppointmentValues) => {
    const { start } = modalPayload as { start: string; end: string };
    const dateStr = format(new Date(start), "yyyy-MM-dd");

    const [startH, startM] = values.startTime.split(":").map(Number);
    const [endH, endM] = values.endTime.split(":").map(Number);

    const { error } = await supabase.from("slots").insert({
      start_at: toColombiaISOString(dateStr, startH, startM),
      end_at: toColombiaISOString(dateStr, endH, endM),
      block_type: "appointment",
      patient_id: values.patientId,
      procedure_id: values.procedureId,
      status: "confirmed",
      channel: values.channel,
    });

    if (error) {
      toast.error("Error al crear la cita.");
      return;
    }

    toast.success("Cita agendada correctamente.");
    closeModal();
    onSuccess?.();
  }, [closeModal, modalPayload, onSuccess, supabase]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closeModal()}>
      <DialogContent className="max-w-lg rounded-[18px]">
        <DialogHeader>
          <DialogTitle className="font-heading text-lg font-semibold">
            Acción sobre el espacio
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="appointment" className="mt-2">
          <TabsList className="bg-muted/50 rounded-[12px] w-full">
            <TabsTrigger value="appointment" className="flex-1 text-xs">
              <CalendarPlus className="size-3 mr-1.5" />
              Agendar cita
            </TabsTrigger>
            <TabsTrigger value="block" className="flex-1 text-xs">
              <Lock className="size-3 mr-1.5" />
              Bloquear espacio
            </TabsTrigger>
          </TabsList>

          {/* Agendar cita */}
          <TabsContent value="appointment" className="mt-4">
            <form
              onSubmit={apptForm.handleSubmit(onAppointment)}
              className="space-y-4"
            >
              {/* Buscar paciente */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Paciente</Label>
                <Input
                  placeholder="Buscar por nombre o teléfono…"
                  value={searchValue}
                  onChange={(e) => {
                    const value = e.target.value;
                    setSearchValue(value);
                    apptForm.setValue("patientSearch", value);
                    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
                    searchTimeoutRef.current = setTimeout(() => {
                      void searchPatients(value);
                    }, 300);
                  }}
                />
                {isSearching && (
                  <p className="text-xs text-muted-foreground">Buscando…</p>
                )}
                {patients.length > 0 && (
                  <div className="border border-border rounded-[12px] overflow-hidden">
                    {patients.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        className="w-full text-left px-3 py-2 text-sm hover:bg-muted/50 transition-colors border-b last:border-0 border-border/50"
                        onClick={() => {
                          apptForm.setValue("patientId", p.id, { shouldValidate: true, shouldDirty: true });
                          apptForm.setValue("patientSearch", p.name, { shouldValidate: true });
                          setSearchValue(p.name);
                          setPatients([]);
                        }}
                      >
                        <p className="font-medium">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{p.phone}</p>
                      </button>
                    ))}
                  </div>
                )}
                {apptForm.formState.errors.patientId && (
                  <p className="text-xs text-destructive">
                    {apptForm.formState.errors.patientId.message}
                  </p>
                )}
              </div>

              {/* patientId hidden - registered for react-hook-form tracking */}
              <Controller
                control={apptForm.control}
                name="patientId"
                render={({ field }) => <input type="hidden" {...field} />}
              />

              {/* Procedimiento */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Procedimiento</Label>
                <Controller
                  control={apptForm.control}
                  name="procedureId"
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={(v: string | null) => field.onChange(v ?? "")}
                    >
                      <SelectTrigger className="rounded-[12px]">
                        <SelectValue placeholder="Seleccionar procedimiento" />
                      </SelectTrigger>
                      <SelectContent>
                        {procedures.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name} ({p.duration_min} min)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              {/* Horario */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium flex items-center gap-1.5">
                  <Clock className="size-3.5 text-muted-foreground" />
                  Horario de la cita
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Hora inicio</Label>
                    <Input
                      type="time"
                      value={apptForm.watch("startTime") ?? initialStartTime}
                      onChange={(e) =>
                        apptForm.setValue("startTime", e.target.value, {
                          shouldValidate: true,
                          shouldDirty: true,
                        })
                      }
                      className="rounded-[12px] h-9 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Hora fin</Label>
                    <Input
                      type="time"
                      value={apptForm.watch("endTime") ?? initialEndTime}
                      onChange={(e) =>
                        apptForm.setValue("endTime", e.target.value, {
                          shouldValidate: true,
                          shouldDirty: true,
                        })
                      }
                      className="rounded-[12px] h-9 text-sm"
                    />
                  </div>
                </div>
                {apptForm.formState.errors.startTime && (
                  <p className="text-xs text-destructive">
                    {apptForm.formState.errors.startTime.message}
                  </p>
                )}
                {apptForm.formState.errors.endTime && (
                  <p className="text-xs text-destructive">
                    {apptForm.formState.errors.endTime.message}
                  </p>
                )}
              </div>

              {/* Canal */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Canal de origen</Label>
                <Controller
                  control={apptForm.control}
                  name="channel"
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={(v: string | null) =>
                        field.onChange((v ?? "web") as AppointmentValues["channel"])
                      }
                    >
                      <SelectTrigger className="rounded-[12px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(["whatsapp", "messenger", "instagram", "web", "tiktok", "manual"] as const).map((ch) => (
                          <SelectItem key={ch} value={ch} className="capitalize">
                            {ch}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 rounded-[12px]"
                  onClick={closeModal}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-primary text-[#0D141D] font-semibold rounded-[12px] hover:bg-primary/90"
                  disabled={apptForm.formState.isSubmitting}
                >
                  {apptForm.formState.isSubmitting ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    "Confirmar cita"
                  )}
                </Button>
              </div>
            </form>
          </TabsContent>

          {/* Bloquear espacio */}
          <TabsContent value="block" className="mt-4">
            <form
              onSubmit={blockForm.handleSubmit(onBlock)}
              className="space-y-4"
            >
              {/* Selección de días */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium flex items-center gap-1.5">
                  <CalendarDays className="size-3.5 text-muted-foreground" />
                  Días a bloquear
                </Label>

                {/* Días ya seleccionados (chips) */}
                {selectedDates && selectedDates.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {[...selectedDates]
                      .sort((a, b) => a.getTime() - b.getTime())
                      .map((date, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[8px] bg-muted text-xs font-medium"
                        >
                          {format(date, "d MMM", { locale: es })}
                          <button
                            type="button"
                            onClick={() => removeDate(date)}
                            className="text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <Trash2 className="size-3" />
                          </button>
                        </span>
                      ))}
                  </div>
                )}

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full rounded-[12px] text-xs h-8"
                  onClick={() => setShowCalendar(!showCalendar)}
                >
                  <CalendarDays className="size-3.5 mr-1.5" />
                  {showCalendar ? "Ocultar calendario" : "Seleccionar días"}
                </Button>

                {showCalendar && (
                  <div className="flex justify-center border border-border rounded-[12px] bg-background mt-1">
                    <DayPicker
                      mode="multiple"
                      selected={selectedDates ?? []}
                      onSelect={(dates) => {
                        blockForm.setValue("dates", dates ?? [], {
                          shouldValidate: true,
                          shouldDirty: true,
                        });
                      }}
                      month={calendarMonth}
                      onMonthChange={setCalendarMonth}
                      locale={es}
                      showOutsideDays={false}
                      disabled={{ before: new Date() }}
                      classNames={{
                        root: "p-3",
                        months: "flex flex-col gap-3",
                        month: "flex flex-col gap-3",
                        nav: "absolute inset-x-0 top-0 flex items-center justify-between gap-1 p-2",
                        month_caption: "flex justify-center h-8 items-center font-medium text-sm",
                        weekdays: "flex",
                        weekday: "flex-1 text-[0.7rem] font-normal text-muted-foreground text-center",
                        week: "flex w-full mt-1",
                        day: "flex-1 aspect-square text-center p-0 [&:first-child>button]:rounded-l-[8px] [&:last-child>button]:rounded-r-[8px]",
                        day_button: "size-full rounded-[8px] text-xs hover:bg-muted transition-colors border-0 bg-transparent",
                        selected: "bg-primary text-primary-foreground rounded-[8px] hover:bg-primary/90",
                        today: "font-bold bg-muted/50",
                        outside: "text-muted-foreground/40",
                        disabled: "text-muted-foreground/30",
                        chevron: "size-4",
                      }}
                    />
                  </div>
                )}

                {blockForm.formState.errors.dates && (
                  <p className="text-xs text-destructive">
                    {blockForm.formState.errors.dates.message}
                  </p>
                )}
              </div>

              {/* Horario */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium flex items-center gap-1.5">
                  <Clock className="size-3.5 text-muted-foreground" />
                  Horario del bloqueo
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Hora inicio</Label>
                    <Input
                      type="time"
                      value={selectedStartTime ?? "09:00"}
                      onChange={(e) =>
                        blockForm.setValue("startTime", e.target.value, {
                          shouldValidate: true,
                          shouldDirty: true,
                        })
                      }
                      className="rounded-[12px] h-9 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Hora fin</Label>
                    <Input
                      type="time"
                      value={selectedEndTime ?? "09:30"}
                      onChange={(e) =>
                        blockForm.setValue("endTime", e.target.value, {
                          shouldValidate: true,
                          shouldDirty: true,
                        })
                      }
                      className="rounded-[12px] h-9 text-sm"
                    />
                  </div>
                </div>
                {blockForm.formState.errors.startTime && (
                  <p className="text-xs text-destructive">
                    {blockForm.formState.errors.startTime.message}
                  </p>
                )}
                {blockForm.formState.errors.endTime && (
                  <p className="text-xs text-destructive">
                    {blockForm.formState.errors.endTime.message}
                  </p>
                )}
              </div>

              {/* Resumen */}
              {selectedDates && selectedDates.length > 0 && selectedStartTime && selectedEndTime && (
                <div className="rounded-[12px] bg-muted/50 p-3 text-xs text-muted-foreground space-y-0.5">
                  <p>
                    <span className="font-medium text-foreground">{selectedDates.length}</span> día(s)
                    seleccionados
                  </p>
                  <p>
                    Bloque de <span className="font-medium text-foreground">{selectedStartTime}</span> a{" "}
                    <span className="font-medium text-foreground">{selectedEndTime}</span>
                  </p>
                </div>
              )}

              {/* Tipo de bloqueo */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Tipo de bloqueo</Label>
                <Controller
                  control={blockForm.control}
                  name="blockType"
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={(v: string | null) =>
                        field.onChange((v ?? "admin") as BlockValues["blockType"])
                      }
                    >
                      <SelectTrigger className="rounded-[12px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="surgery">🔪 Cirugía</SelectItem>
                        <SelectItem value="admin">📋 Administrativo</SelectItem>
                        <SelectItem value="vacation">🏖️ Vacaciones</SelectItem>
                        <SelectItem value="event">🎯 Evento</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 rounded-[12px]"
                  onClick={closeModal}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-primary text-[#0D141D] font-semibold rounded-[12px] hover:bg-primary/90"
                  disabled={blockForm.formState.isSubmitting}
                >
                  {blockForm.formState.isSubmitting ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    "Bloquear espacio"
                  )}
                </Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
