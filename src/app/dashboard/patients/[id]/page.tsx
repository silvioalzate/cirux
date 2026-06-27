import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import { format } from "date-fns/format";
import { es } from "date-fns/locale/es";
import { PatientNotes } from "@/components/patients/PatientNotes";
import { PatientEditor } from "@/components/patients/PatientEditor";
import { PatientAppointmentsList } from "@/components/patients/PatientAppointmentsList";
import type { Message } from "@/lib/types";

export const dynamic = "force-dynamic";

interface PatientDetailPageProps {
  params: Promise<{ id: string }>;
}

async function getPatient(id: string) {
  const supabase = await createClient();

  const [{ data: patient, error: patientError }, { data: messages, error: messagesError }] =
    await Promise.all([
      supabase
        .from("patients")
        .select("*, patient_profile:patient_profiles(*)")
        .eq("id", id)
        .single(),
      supabase
        .from("messages")
        .select("id, patient_id, conversation_id, channel, direction, type, content, transcript, created_at")
        .eq("patient_id", id)
        .order("created_at", { ascending: false })
        .limit(50),
    ]);

  if (patientError) console.error("getPatient: patient error:", patientError.message);
  if (messagesError) console.error("getPatient: messages error:", messagesError.message);

  // patient_profiles join returns an array - extract first element
  const profile = Array.isArray(patient?.patient_profile)
    ? patient.patient_profile[0]
    : patient?.patient_profile ?? null;

  const normalizedPatient = patient
    ? { ...patient, patient_profile: profile }
    : null;

  return {
    patient: normalizedPatient,
    messages: (messages ?? []) as Message[],
  };
}

const channelEmoji: Record<string, string> = {
  whatsapp: "💬",
  messenger: "💙",
  instagram: "📸",
  tiktok: "🎵",
  web: "🌐",
  manual: "✍️",
};

/**
 * Ficha completa del paciente con Tabs: datos, citas, conversaciones y notas.
 */
export default async function PatientDetailPage({ params }: PatientDetailPageProps) {
  const { id } = await params;
  // Validate UUID before querying
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    notFound();
  }
  const { patient, messages } = await getPatient(id);

  if (!patient) notFound();

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Botón volver */}
      <Link
        href="/dashboard/patients"
        className="inline-flex items-center gap-1.5 rounded-[12px] text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 px-3 py-2 -ml-3 transition-colors"
      >
        <ArrowLeft className="size-4" />
        Volver a pacientes
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-heading font-bold text-2xl text-foreground">
            {patient.name}
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            {patient.phone}
            {patient.email ? ` · ${patient.email}` : ""}
          </p>
        </div>
        <Badge
          variant="outline"
          className={`capitalize ${
            patient.status === "activo"
              ? "text-emerald-700 bg-emerald-50 border-emerald-200"
              : patient.status === "prospecto"
              ? "text-yellow-700 bg-yellow-50 border-yellow-200"
              : "text-gray-600 bg-gray-50 border-gray-200"
          }`}
        >
          {patient.status}
        </Badge>
      </div>

      <Tabs defaultValue="datos">
        <TabsList className="bg-muted/50 rounded-[12px]">
          <TabsTrigger value="datos">Datos Personales</TabsTrigger>
          <TabsTrigger value="citas">
            Historial de Citas
          </TabsTrigger>
          <TabsTrigger value="conversaciones">
            Conversaciones ({messages.length})
          </TabsTrigger>
          <TabsTrigger value="notas">Notas Clínicas</TabsTrigger>
        </TabsList>

        {/* Datos Personales */}
        <TabsContent value="datos" className="mt-4">
          <PatientEditor patient={patient} />
        </TabsContent>

        {/* Historial de citas */}
        <TabsContent value="citas" className="mt-4">
          <PatientAppointmentsList patientId={patient.id} />
        </TabsContent>

        {/* Conversaciones */}
        <TabsContent value="conversaciones" className="mt-4">
          <Card className="border-border">
            <CardContent className="pt-6">
              {messages.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-8">
                  No hay mensajes registrados.
                </p>
              ) : (
                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex gap-2 ${
                        msg.direction === "out" ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[75%] rounded-[12px] px-3 py-2 text-sm ${
                          msg.direction === "out"
                            ? "bg-primary/10 text-foreground"
                            : "bg-muted text-foreground"
                        }`}
                      >
                        <p className="leading-relaxed">{msg.transcript ?? msg.content}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {channelEmoji[msg.channel] ?? "💬"}{" "}
                          {format(new Date(msg.created_at), "HH:mm", { locale: es })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notas Clínicas */}
        <TabsContent value="notas" className="mt-4">
          <Card className="border-border">
            <CardContent className="pt-6">
              {patient.patient_profile?.id ? (
                <PatientNotes
                  profileId={patient.patient_profile.id}
                  initialNotes={patient.patient_profile.notes ?? null}
                />
              ) : (
                <p className="text-sm text-muted-foreground">
                  No hay perfil clínico registrado para este paciente.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
