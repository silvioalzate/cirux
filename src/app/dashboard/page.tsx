import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import {
  CalendarDays,
  Users,
  BellRing,
  TrendingUp,
  CheckCircle2,
  BarChart3,
  Clock,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns/format";
import { es } from "date-fns/locale/es";
import { formatPgTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

const STATUS_COLORS: Record<string, string> = {
  confirmed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  cancelled: "bg-red-50 text-red-700 border-red-200",
  completed: "bg-gray-50 text-gray-600 border-gray-200",
  reschedule: "bg-yellow-50 text-yellow-700 border-yellow-200",
};

const STATUS_LABELS: Record<string, string> = {
  confirmed: "Confirmada",
  cancelled: "Cancelada",
  completed: "Completada",
  reschedule: "Reprogramar",
};

const CHANNEL_LABELS: Record<string, string> = {
  whatsapp: "WhatsApp",
  messenger: "Messenger",
  instagram: "Instagram",
  tiktok: "TikTok",
  web: "Web",
};

async function getDashboardData() {
  const supabase = await createClient();
  // Fecha en zona horaria de Colombia (UTC-5) sin depender del TZ del servidor
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/Bogota" });

  const [
    { data: todayApps },
    { count: totalPatients },
    { count: pendingConversations },
    { data: monthlyRaw },
    { data: topProcRaw },
    { data: channelRaw },
    { count: totalCompleted },
  ] = await Promise.all([
    supabase
      .from("slots")
      .select("*, patient:patients(name, phone), procedure:procedures(name)")
      .eq("block_type", "appointment")
      .gte("start_at", `${today}T00:00:00`)
      .lt("start_at", `${today}T23:59:59`)
      .order("start_at", { ascending: true }),

    supabase.from("patients").select("*", { count: "exact", head: true }),

    supabase
      .from("conversations")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending_human"),

    supabase
      .from("slots")
      .select("created_at")
      .eq("block_type", "appointment")
      .gte("created_at", new Date(Date.now() - 180 * 86400000).toISOString())
      .limit(500),

    supabase
      .from("slots")
      .select("procedure_id, procedure:procedures(name)")
      .eq("block_type", "appointment")
      .not("procedure_id", "is", null)
      .limit(500),

    supabase
      .from("slots")
      .select("channel")
      .eq("block_type", "appointment")
      .limit(500),

    supabase
      .from("slots")
      .select("*", { count: "exact", head: true })
      .eq("block_type", "appointment")
      .eq("status", "completed"),
  ]);

  // Compute monthly stats
  const byMonth: Record<string, number> = {};
  for (const a of (monthlyRaw ?? [])) {
    const m = (a as { created_at: string }).created_at.slice(0, 7);
    byMonth[m] = (byMonth[m] || 0) + 1;
  }
  const monthlyStats: MonthlyStat[] = Object.entries(byMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([month, total]) => ({ month, total }));

  // Compute top procedures
  const byProc: Record<string, number> = {};
  for (const a of (topProcRaw ?? [])) {
    const procedures = (a as { procedure: { name: string }[] }).procedure;
    const name = (Array.isArray(procedures) ? procedures[0]?.name : null) ?? "Sin especificar";
    byProc[name] = (byProc[name] || 0) + 1;
  }
  const topProcedures: ProcedureStat[] = Object.entries(byProc)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));

  // Compute channel stats
  const byChannel: Record<string, number> = {};
  for (const a of (channelRaw ?? [])) {
    const ch = (a as { channel: string }).channel || "web";
    byChannel[ch] = (byChannel[ch] || 0) + 1;
  }
  const channelStats: ChannelStat[] = Object.entries(byChannel)
    .sort(([, a], [, b]) => b - a)
    .map(([channel, count]) => ({ channel, count }));

  return {
    todayApps: (todayApps ?? []) as TodayAppointment[],
    totalPatients: totalPatients ?? 0,
    pendingConversations: pendingConversations ?? 0,
    totalCompleted: totalCompleted ?? 0,
    monthlyStats,
    topProcedures,
    channelStats,
  };
}

type TodayAppointment = {
  id: string;
  status: string;
  channel: string;
  start_at: string;
  end_at: string;
  patient: { name: string; phone: string } | null;
  procedure: { name: string } | null;
};

type MonthlyStat = { month: string; total: number };
type ProcedureStat = { name: string; count: number };
type ChannelStat = { channel: string; count: number };

function monthLabel(month: string) {
  const [y, m] = month.split("-");
  const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  return `${months[parseInt(m) - 1]} ${y.slice(2)}`;
}

/**
 * Dashboard portada: citas del día (izq) + estadísticas del negocio (der).
 */
export default async function DashboardPage() {
  const d = await getDashboardData();

  const completionPct =
    d.totalCompleted > 0 && d.totalPatients > 0
      ? Math.round((d.totalCompleted / d.totalPatients) * 100)
      : 0;

  const maxMonthly = Math.max(1, ...d.monthlyStats.map((m: MonthlyStat) => m.total));
  const maxProc = Math.max(1, ...d.topProcedures.map((p: ProcedureStat) => p.count));
  const maxChan = Math.max(1, ...d.channelStats.map((c: ChannelStat) => c.count));

  return (
    <div className="space-y-6">
      {/* Título */}
      <div>
        <h2 className="font-heading font-bold text-2xl text-foreground">
          Vista General
        </h2>
        <p className="text-muted-foreground text-sm mt-1">
          {format(new Date(), "EEEE d 'de' MMMM, yyyy", { locale: es })}
        </p>
      </div>

      {/* ─── MAIN GRID: Citas del día (izq) + Estadísticas (der) ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ──────── LEFT: Citas de hoy ──────── */}
        <div className="lg:col-span-2">
          <Card className="border-border h-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CalendarDays className="size-4 text-primary" />
                  <CardTitle className="font-heading text-base font-semibold">
                    Citas de Hoy
                  </CardTitle>
                </div>
                <Link
                  href="/dashboard/calendar"
                  className="text-xs text-primary hover:underline font-medium flex items-center gap-1"
                >
                  Ver todas <ArrowRight className="size-3" />
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {d.todayApps.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-2">
                  <CalendarDays className="size-10 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">No hay citas programadas para hoy</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {d.todayApps.map((apt) => (
                    <div
                      key={apt.id}
                      className="flex items-center gap-4 p-3 rounded-[12px] bg-muted/20 border border-border/50 hover:bg-muted/40 transition-colors"
                    >
                      {/* Hora */}
                      <div className="w-16 shrink-0 text-center">
                        <p className="text-sm font-heading font-bold text-foreground">
                          {apt.start_at ? formatPgTime(apt.start_at, "HH:mm") : "—:—"}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {apt.start_at ? formatPgTime(apt.start_at, "haaa") : ""}
                        </p>
                      </div>

                      {/* Divider */}
                      <div className="w-px h-8 bg-border/50 shrink-0" />

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {apt.patient?.name ?? "Paciente"}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-xs text-muted-foreground truncate">
                            {apt.procedure?.name ?? "Procedimiento"}
                          </p>
                          <span className="text-[10px] text-muted-foreground/60">
                            {CHANNEL_LABELS[apt.channel] ?? apt.channel}
                          </span>
                        </div>
                      </div>

                      {/* Status */}
                      <Badge
                        variant="outline"
                        className={`text-[10px] shrink-0 ${STATUS_COLORS[apt.status] ?? STATUS_COLORS.confirmed}`}
                      >
                        {STATUS_LABELS[apt.status] ?? apt.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ──────── RIGHT: Estadísticas de negocio ──────── */}
        <div className="space-y-4">
          {/* Quick KPIs */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="border-border">
              <CardContent className="pt-4 pb-3">
                <Users className="size-4 text-primary mb-1.5" />
                <p className="text-2xl font-heading font-bold text-foreground">
                  {d.totalPatients}
                </p>
                <p className="text-[10px] text-muted-foreground">Pacientes</p>
              </CardContent>
            </Card>
            <Card className="border-border">
              <CardContent className="pt-4 pb-3">
                <CheckCircle2 className="size-4 text-emerald-500 mb-1.5" />
                <p className="text-2xl font-heading font-bold text-foreground">
                  {completionPct}%
                </p>
                <p className="text-[10px] text-muted-foreground">Completadas</p>
              </CardContent>
            </Card>
            <Card className="border-border">
              <CardContent className="pt-4 pb-3">
                <BellRing className="size-4 text-secondary mb-1.5" />
                <p className="text-2xl font-heading font-bold text-foreground">
                  {d.pendingConversations}
                </p>
                <p className="text-[10px] text-muted-foreground">Pendientes</p>
              </CardContent>
            </Card>
            <Card className="border-border">
              <CardContent className="pt-4 pb-3">
                <TrendingUp className="size-4 text-accent mb-1.5" />
                <p className="text-2xl font-heading font-bold text-foreground">
                  {d.todayApps.length}
                </p>
                <p className="text-[10px] text-muted-foreground">Hoy</p>
              </CardContent>
            </Card>
          </div>

          {/* Monthly chart */}
          <Card className="border-border">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <BarChart3 className="size-3.5 text-muted-foreground" />
                <CardTitle className="font-heading text-sm font-semibold">
                  Citas por mes
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {d.monthlyStats.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4 text-center">Sin datos</p>
              ) : (
                <div className="space-y-2.5">
                  {d.monthlyStats.map((m: MonthlyStat) => (
                    <div key={m.month} className="space-y-1">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-muted-foreground">{monthLabel(m.month)}</span>
                        <span className="font-medium text-foreground">{m.total}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: `${Math.round((m.total / maxMonthly) * 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top procedures */}
          <Card className="border-border">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="size-3.5 text-muted-foreground" />
                <CardTitle className="font-heading text-sm font-semibold">
                  Top procedimientos
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {d.topProcedures.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4 text-center">Sin datos</p>
              ) : (
                <div className="space-y-2">
                  {d.topProcedures.map((p: ProcedureStat, i: number) => (
                    <div key={p.name} className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-muted-foreground w-4 text-right">
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-foreground font-medium truncate">{p.name}</span>
                          <span className="text-muted-foreground ml-2">{p.count}</span>
                        </div>
                        <div className="h-1 rounded-full bg-muted mt-1 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-accent transition-all"
                            style={{ width: `${Math.round((p.count / maxProc) * 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Channel distribution */}
          <Card className="border-border">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Clock className="size-3.5 text-muted-foreground" />
                <CardTitle className="font-heading text-sm font-semibold">
                  Canales
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {d.channelStats.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4 text-center">Sin datos</p>
              ) : (
                <div className="space-y-1.5">
                  {d.channelStats.map((c: ChannelStat) => (
                    <div key={c.channel} className="flex items-center justify-between text-xs">
                      <span className="text-foreground capitalize">
                        {CHANNEL_LABELS[c.channel] ?? c.channel}
                      </span>
                      <span className="text-muted-foreground font-medium">{c.count}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ─── Bottom: Pending alert ─── */}
      {d.pendingConversations > 0 && (
        <Card className="border-secondary/30 bg-secondary/5">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-[12px] bg-secondary/20 flex items-center justify-center shrink-0">
                <BellRing className="size-5 text-secondary-foreground" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm text-foreground">
                  {d.pendingConversations} conversación
                  {d.pendingConversations !== 1 ? "es" : ""} pendiente
                  {d.pendingConversations !== 1 ? "s" : ""}
                </p>
                <p className="text-xs text-muted-foreground">
                  Pacientes esperando respuesta humana
                </p>
              </div>
              <Link
                href="/dashboard/notifications"
                className="text-sm text-primary font-medium hover:underline flex items-center gap-1 shrink-0"
              >
                Atender <ArrowRight className="size-3" />
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
