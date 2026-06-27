import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Save } from "lucide-react";
import type { AgentConfig } from "@/lib/types";

async function getConfig() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.app_metadata?.role !== "admin") {
    redirect("/dashboard");
  }

  const { data, error } = await supabase
    .from("agent_config")
    .select("*")
    .single();

  if (error && error.code !== "PGRST116") {
    redirect("/dashboard");
  }

  return data as AgentConfig | null;
}

const DAY_LABELS: Record<string, string> = {
  mon: "Lunes",
  tue: "Martes",
  wed: "Miércoles",
  thu: "Jueves",
  fri: "Viernes",
  sat: "Sábado",
  sun: "Domingo",
};

const DAY_ORDER = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

/**
 * Página de configuración del agente IA y del consultorio (RF-09.5).
 * Solo accesible para rol admin.
 */
export default async function SettingsPage() {
  const config = await getConfig();
  const workingHours = config?.working_hours ?? {};

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="font-heading font-bold text-2xl text-foreground">Configuración</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Configura el agente IA, horarios y parámetros del consultorio
        </p>
      </div>

      {/* System Prompt */}
      <Card className="border-border rounded-[18px]">
        <CardHeader>
          <CardTitle className="font-heading text-base font-semibold">
            Prompt del Agente IA
          </CardTitle>
          <CardDescription className="text-xs">
            Define la personalidad y restricciones del asistente virtual. Este texto
            se envía como contexto en cada conversación.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="system-prompt" className="text-sm font-medium">
                Instrucciones del sistema
              </Label>
              <Textarea
                id="system-prompt"
                defaultValue={config?.system_prompt ?? ""}
                rows={10}
                placeholder="Eres un asistente de atención al paciente para la Clínica Dr. Ejemplo…"
                className="text-sm resize-none"
                readOnly
              />
            </div>
            <Button
              className="bg-primary text-[#0D141D] font-semibold rounded-[18px] hover:bg-primary/90"
              type="button"
              disabled
            >
              <Save className="size-4 mr-2" />
              Guardar cambios
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Working Hours */}
      <Card className="border-border rounded-[18px]">
        <CardHeader>
          <CardTitle className="font-heading text-base font-semibold">
            Horario de Atención
          </CardTitle>
          <CardDescription className="text-xs">
            El agente solo ofrecerá slots dentro de este horario.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {DAY_ORDER.map((day) => {
              const hours = workingHours[day];
              return (
                <div key={day} className="flex items-center justify-between py-1 border-b border-border/50 last:border-0">
                  <span className="text-sm font-medium text-foreground capitalize">
                    {DAY_LABELS[day] ?? day}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {hours ? `${hours[0]} – ${hours[1]}` : "Cerrado"}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Canales habilitados */}
      <Card className="border-border rounded-[18px]">
        <CardHeader>
          <CardTitle className="font-heading text-base font-semibold">
            Canales Habilitados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {(config?.enabled_channels ?? ["whatsapp", "web"]).map((ch) => (
              <span
                key={ch}
                className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium capitalize"
              >
                {ch}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
